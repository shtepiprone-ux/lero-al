import { useAuth } from '@/modules/auth/context/AuthContext'

// Thin wrapper kept for backwards compatibility with all existing call sites.
export function useUser() {
  return useAuth()
}
