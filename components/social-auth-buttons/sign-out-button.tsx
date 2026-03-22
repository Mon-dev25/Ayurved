import { supabase } from '@/lib/supabase.web'
import { useRouter } from 'expo-router'
import React from 'react'
import { Button } from 'react-native'

export default function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) {
        console.error('Error signing out:', error)
      } else {
        router.replace('/modal')
      }
    } catch (e) {
      console.error('Sign out threw:', e)
    }
  }

  return <Button title="Sign out" onPress={handleSignOut} />
}