import { createContext, useContext } from 'react'

export type UserRole = 'doctor' | 'patient'

export type AuthData = {
  claims?: Record<string, any> | null
  profile?: any | null
  isLoading: boolean
  isLoggedIn: boolean
  role?: UserRole | null
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthData>({
  claims: undefined,
  profile: undefined,
  isLoading: true,
  isLoggedIn: false,
  role: null,
  refreshProfile: async () => {},
})

export const useAuthContext = () => useContext(AuthContext)