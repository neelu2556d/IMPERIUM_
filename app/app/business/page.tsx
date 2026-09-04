'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback, useTransition } from 'react'
import styles from './business.module.css'
import { createClient } from '@/lib/supabase/client'
import { useBusinessState } from '@/lib/business/state'
import { getBusinessTileStats, type DashboardTileStats } from '@/lib/vitality/dashboardStats'
import BusinessModule from '@/components/business/BusinessModule'
import type { BusinessTab } from '@/lib/business/types'
import WelcomeBackdrop from '@/components/WelcomeBackdrop'

/**
 * /app/business - the Business tile.
 *
 * Entry point for the Business module. All data lives in the single-state
 * hook (useBusinessState) which persists to localStorage and syncs with
 * Supabase tables. Any authenticated user can access this tile.
 */

export default function BusinessPage() {
  const supabase = createClient()
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [stats, setStats] = useState<{ totalMonthlySales: number | null; activeLots: number | null }>({
    totalMonthlySales: null,
    activeLots: null,
  })
  const [isPending, setTransition] = useTransition()

  // Fetch user and set authorization
  useEffect(() => {
    let cancelled = false
    async function fetchUser() {
      const { data } = await supabase.auth.getUser()
      if (!cancelled) {
        setUser(data.user ?? null)
        // Make the business tile public — any logged-in user can access it
        setIsAuthorized(!!data.user)
      }
    }
    fetchUser()
    return () => { cancelled = true }
  }, [supabase])

  // Load tile stats for the dashboard
  useEffect(() => {
    if (isAuthorized && user) {
      getBusinessTileStats(supabase, user.id).then((s) => setStats(s))
    }
  }, [supabase, user, isAuthorized])

  // Load business state
  const {
    state: businessState,
    ready: businessReady,
    isAuthorized: businessAuth,
    setActiveTab,
  } = useBusinessState()

  if (!isAuthorized) {
    // Not authenticated — show the welcome backdrop for the public tile landing
    return (
      <main className={styles.page} >
        <WelcomeBackdrop />
      </main>
    )
  }

  const activeTab: BusinessTab = businessState.activeTab || 'lots'

  // Tab labels
  const tabLabels: Record<BusinessTab, string> = {
    lots: 'Lots',
    orders: 'Orders',
    stock: 'Stock Register',
    sales: 'Sales Register',
    party: 'Party Ledger',
    collection: 'Collection Register',
    reports: 'Reports',
    imperium: 'Imperium AI',
  }

  return (
    <main className={styles.page} >
      <WelcomeBackdrop />
      <div className={styles.shell}>
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            DASHBOARD
          </Link>
          <div className={styles.greetWrap}>
            <div className={styles.greetText}>
              <span className={styles.greetLabel}>VITALITY · IMPERIUM</span>
              <span className={styles.greetLine} suppressHydrationWarning>
                {user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''}.
              </span>
            </div>
            <div className={styles.mark} aria-hidden>I</div>
          </div>
        </div>

        {/* Active tab indicator */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabButton} ${activeTab === 'lots' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('lots')}
          >
            {tabLabels.lots}
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'orders' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            {tabLabels.orders}
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'stock' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            {tabLabels.stock}
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'sales' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            {tabLabels.sales}
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'party' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('party')}
          >
            {tabLabels.party}
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'collection' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('collection')}
          >
            {tabLabels.collection}
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'reports' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            {tabLabels.reports}
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'imperium' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('imperium')}
          >
            {tabLabels.imperium}
          </button>
        </div>

        {/* Tile stats */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Active Lots</div>
            <div className={styles.statValue}>
              {stats.activeLots ?? '—'}
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Monthly Sales</div>
            <div className={styles.statValue}>
              {stats.totalMonthlySales !== null ? `₹${stats.totalMonthlySales.toLocaleString('en-US')}` : '—'}
            </div>
          </div>
        </div>

        {/* Module content */}
        <section className={styles.content}>
          <BusinessModule
            tab={activeTab}
            onTabChange={setActiveTab}
          />
        </section>

              </div>
    </main>
  )
}