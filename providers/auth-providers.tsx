import { AuthContext, type UserRole } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase.web'
import type { User } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import * as QueryParams from 'expo-auth-session/build/QueryParams'
import { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react'

export default function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null | undefined>()
  const [profile, setProfile] = useState<any>()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const userRef = useRef<User | null | undefined>(null)
  userRef.current = user
 const [profileLoaded, setProfileLoaded] = useState<boolean>(false)
  const fetchProfileForUser = useCallback(async (targetUser: User) => {
    let { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUser.id)
      .single()

    if (!data) {
      const { data: created } = await supabase
        .from('profiles')
        .insert({
          id: targetUser.id,
          full_name: targetUser.user_metadata?.full_name ?? null,
          email: targetUser.email ?? null,
          avatar_url: targetUser.user_metadata?.avatar_url ?? null,
        })
        .select()
        .single()
      data = created

      if (!data) {
        const { data: refetched } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUser.id)
          .single()
        data = refetched
      }
    }

    if (data?.role === 'doctor') {
      await supabase.from('doctors').upsert({ id: targetUser.id })
    } else if (data?.role === 'patient') {
      await supabase.from('patients').upsert({ id: targetUser.id })
    }

    return data
  }, [])

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      // Supabase email confirmation / magic-link flows can redirect back with tokens in the URL.
      // Depending on your Supabase settings, this can be:
      // - access_token + refresh_token (implicit)
      // - code (PKCE) -> exchangeCodeForSession(code)
      // - token_hash + type -> verifyOtp({ type, token_hash })
      const { params: queryParams, errorCode } = QueryParams.getQueryParams(url)
      if (errorCode) return

      const fragment = url.includes('#') ? url.split('#')[1] : ''
      const fragmentParams = fragment
        ? QueryParams.getQueryParams(`/?${fragment}`).params
        : ({} as Record<string, any>)

      const params = { ...(queryParams as any), ...(fragmentParams as any) }

      try {
        const code = (params as any)?.code
        if (code && typeof (supabase.auth as any).exchangeCodeForSession === 'function') {
          await (supabase.auth as any).exchangeCodeForSession(code)
          return
        }

        const access_token = (params as any)?.access_token
        const refresh_token = (params as any)?.refresh_token
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token })
          return
        }

        const token_hash = (params as any)?.token_hash
        const type = (params as any)?.type
        if (token_hash && type && typeof (supabase.auth as any).verifyOtp === 'function') {
          await (supabase.auth as any).verifyOtp({ type, token_hash })
        }
      } catch (e) {
        console.log('🔐 deep link auth failed', e)
      }
    }

    const syncSessionToState = async () => {
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      if (!sessionUser) setIsLoading(false)
    }

    const bootstrap = async () => {
      setIsLoading(true)

      const initialUrl = await Linking.getInitialURL()
      if (initialUrl) await handleDeepLink(initialUrl)

      await syncSessionToState()
    }

    void bootstrap()

    const sub = Linking.addEventListener('url', (event) => {
      void (async () => {
        setIsLoading(true)
        await handleDeepLink(event.url)
        await syncSessionToState()
      })()
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Avoid letting an INITIAL_SESSION(null) overwrite a real session we just created from a deep link.
      if (event === 'SIGNED_OUT') {
        setUser(null)
        return
      }

      if (session?.user) {
        setUser(session.user)
        return
      }

      if (event === 'INITIAL_SESSION') {
        if (userRef.current) return
      }

      setUser(null)
    })

    return () => {
      sub.remove()
      subscription.unsubscribe()
    }
  }, [])

useEffect(() => {
  if (!user) {
    setProfile(null)
    setIsLoading(false)
    return
  }

  const load = async () => {
    setIsLoading(true)
    setProfileLoaded(false)
    // Log 1: Direct DB query to see what's actually in the table
    const { data: directCheck } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()
    console.log('🔍 Direct DB check:', directCheck)

    const data = await fetchProfileForUser(user)
    console.log('📋 fetchProfileForUser returned:', { id: data?.id, role: data?.role })
    setProfileLoaded(true)
    setProfile(data)
    setIsLoading(false)
  }

  load()
}, [user, fetchProfileForUser])

  const refreshProfile = useCallback(async () => {
    const current = userRef.current
    if (!current) return
    const data = await fetchProfileForUser(current)
    setProfile({ ...data })
  }, [fetchProfileForUser])

  const isLoggedIn = user !== null && user !== undefined
  const rawRole = profile?.role || user?.user_metadata?.role || null
  const role: UserRole | null = rawRole && rawRole.trim() !== '' ? rawRole : null

  return (
    <AuthContext.Provider
      value={{
        claims: user ? { ...user.user_metadata, sub: user.id } : null,
        isLoading,
        profile,
        isLoggedIn,
        role,
        profileLoaded,
        refreshProfile,
        
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}