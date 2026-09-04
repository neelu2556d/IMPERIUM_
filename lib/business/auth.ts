/**
 * Business module auth helpers.
 * Single-user restriction, configured via env var BUSINESS_OWNER_EMAIL.
 * Defaults to a placeholder; set the real value in .env for local dev.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * The authorized business owner's email address.
 * Reads from process.env.BUSINESS_OWNER_EMAIL at call time so a
 * redeploy can rotate it without a code change.
 */
export function businessOwnerEmail(): string {
  return process.env.BUSINESS_OWNER_EMAIL || ''
}

/**
 * Check if the given email is the authorized business owner.
 * In production, this could be extended to a list or fetched from a table.
 */
export function isBusinessOwner(email: string | null): boolean {
  const owner = businessOwnerEmail()
  return !!owner && email === owner
}

/**
 * Returns a 401 Unauthorized response for API routes.
 */
export function unauthorizedResponse() {
  return new Response('Unauthorized', { status: 401 })
}

/**
 * Returns a 403 Forbidden response for API routes.
 */
export function forbiddenResponse() {
  return new Response('Forbidden: Access restricted to business owner', { status: 403 })
}

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