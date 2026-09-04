'use client'

/**
 * Business module client-side auth hook.
 * Lives in a separate file from auth.ts (server-safe) because it imports
 * useEffect — putting it in a non-'use client' file breaks the build.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isBusinessOwner } from './auth'

/**
 * Hook to check authorization client-side.
 * Falls back to false if Supabase isn't ready.
 */
export function useBusinessAuth() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (cancelled) return

        setIsAuthorized(!(!user || !isBusinessOwner(user.email)))
      } catch {
        setIsAuthorized(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [])

  return { isAuthorized, loading }
}