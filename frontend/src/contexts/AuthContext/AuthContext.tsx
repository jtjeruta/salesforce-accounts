import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { api, type AuthStatus } from '../../api'

type AuthContextValue = {
  status: AuthStatus | null
  loading: boolean
  error: string | null
  connected: boolean
  hostLabel: string
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function formatHost(instanceUrl: string | null | undefined) {
  if (!instanceUrl) return 'Not connected'

  try {
    return new URL(instanceUrl).host
  } catch {
    return instanceUrl
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const nextStatus = await api.getStatus()
      setStatus(nextStatus)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auth status')
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await api.logout()
    queryClient.removeQueries({ queryKey: ['accounts'] })
    await refresh()
  }, [queryClient, refresh])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      loading,
      error,
      connected: Boolean(status?.connected),
      hostLabel: formatHost(status?.instanceUrl),
      refresh,
      logout,
    }),
    [status, loading, error, refresh, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
