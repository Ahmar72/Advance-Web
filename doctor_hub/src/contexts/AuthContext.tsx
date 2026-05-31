import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Role } from '../types/roles'

const validRoles: Role[] = [
  'patient',
  'doctor',
  'assistant',
  'admin',
  'super_admin',
]

const normalizeRole = (value?: string | null): Role | null => {
  if (!value) return null
  const raw = value.trim().toLowerCase()
  if (raw === 'super admin') return 'super_admin'
  if (validRoles.includes(raw as Role)) return raw as Role
  return null
}

const resolveRole = (user: User | null): Role | null => {
  if (!user) return null
  const metaRole = user.app_metadata?.role ?? user.user_metadata?.role
  return normalizeRole(typeof metaRole === 'string' ? metaRole : null)
}

type AuthContextValue = {
  user: User | null
  role: Role | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  const upsertUserProfile = async (nextUser: User, nextRole: Role | null) => {
    await supabase.from('users').upsert({
      id: nextUser.id,
      full_name: (nextUser.user_metadata?.full_name as string | undefined) ?? null,
      role: nextRole ?? 'patient',
    })
  }

  useEffect(() => {
    let alive = true

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      const nextUser = data.session?.user ?? null
      const nextRole = resolveRole(nextUser)
      setUser(nextUser)
      setRole(nextRole)
      setLoading(false)
      if (nextUser) {
        void upsertUserProfile(nextUser, nextRole)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return
      const nextUser = session?.user ?? null
      const nextRole = resolveRole(nextUser)
      setUser(nextUser)
      setRole(nextRole)
      setLoading(false)
      if (nextUser) {
        void upsertUserProfile(nextUser, nextRole)
      }
    })

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [user, role, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
