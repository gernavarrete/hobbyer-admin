'use client'
import { useEffect, useState } from 'react'

export type AdminRole = 'superadmin' | 'admin' | 'support' | null

export function useAdminRole(): AdminRole {
  const [role, setRole] = useState<AdminRole>(null)

  useEffect(() => {
    const token = localStorage.getItem('hobbyer_admin_token')
    if (!token) return
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setRole(payload['custom:admin_role'] ?? null)
    } catch {
      setRole(null)
    }
  }, [])

  return role
}
