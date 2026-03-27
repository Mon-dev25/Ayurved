import { AuthContext, type UserRole } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase.web'
import type { User } from '@supabase/supabase-js'
import { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react'

export default function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null | undefined>()
  const [profile, setProfile] = useState<any>()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const userRef = useRef<User | null | undefined>(null)
  userRef.current = user

  const fetchProfileForUser = useCallback(async (targetUser: User) => {
    let { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUser.id)
      .single()

    if (!data && targetUser.user_metadata?.role) {
      const { data: created } = await supabase
        .from('profiles')
        .upsert({
          id: targetUser.id,
          role: targetUser.user_metadata.role,
          full_name: targetUser.user_metadata.full_name ?? null,
        })
        .select()
        .single()
      data = created
    }

    if (data?.role === 'doctor') {
      await supabase.from('doctors').upsert({ id: targetUser.id })
    } else if (data?.role === 'patient') {
      await supabase.from('patients').upsert({ id: targetUser.id })
    }

    return data
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user ?? null)
      setIsLoading(false)
    }

    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      setUser(_session?.user ?? null)
    })

    return () => {
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
      const data = await fetchProfileForUser(user)
      setProfile(data)
      setIsLoading(false)
    }

    load()
  }, [user, fetchProfileForUser])

  const refreshProfile = useCallback(async () => {
    const current = userRef.current
    if (!current) return
    const data = await fetchProfileForUser(current)
    setProfile(data)
  }, [fetchProfileForUser])

  supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle()

    if (!existing) {
      await supabase.from('profiles').upsert({
        id: session.user.id,
        full_name: session.user.user_metadata?.full_name ?? null,
        role: 'patient',
      })
    }
  }
})
  const isLoggedIn = user != null && user != undefined
  const role: UserRole | null =
    profile?.role || user?.user_metadata?.role || null

  return (
    <AuthContext.Provider
      value={{
        claims: user ? { sub: user.id, ...user.user_metadata } : null,
        isLoading,
        profile,
        isLoggedIn,
        role,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}