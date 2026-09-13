'use client'

import { useEffect } from 'react'
import { useBusinessStore } from '@/lib/business/store'
import styles from './business.module.css'

export function BusinessModule() {
  const { activeTab, setActiveTab, fetchLots, fetchParties, fetchOrders, fetchPayments, fetchRates } = useBusinessStore()

  // Load data on mount
  useEffect(() => {
    fetchLots()
    fetchParties()
    fetchOrders()
    fetchPayments()
    fetchRates()
  }, [fetchLots, fetchParties, fetchOrders, fetchPayments, fetchRates])

  return (
    <div className={styles.businessModule}>
      <header className={styles.header}>
        <h1 className={styles.title}>Business</h1>
        <p className={styles.subtitle}>Lots · Parties · Orders · Payments</p>
      </header>

      <nav className={styles.tabBar} aria-label="Business sections">
        <div className={styles.tabBarInner}>
          {(['lots', 'parties', 'orders', 'payments', 'reports', 'ai', 'profiles', 'connections', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`${styles.tab} ${tab === activeTab ? styles.active : ''}`}
              onClick={() => setActiveTab(tab)}
              aria-pressed={tab === activeTab}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <div className={styles.tabContent}>
        {activeTab === 'lots' && <LotsView />}
        {activeTab === 'parties' && <PartiesView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'payments' && <PaymentsView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'ai' && <AiView />}
        {activeTab === 'profiles' && <ProfilesView />}
        {activeTab === 'connections' && <ConnectionsView />}
        {activeTab === 'settings' && <SettingsView />}
      </div>
    </div>
  )
}

// Placeholder views - will be implemented progressively
const LotsView = () => <div className={styles.view}>Lots view placeholder</div>
const PartiesView = () => <div className={styles.view}>Parties view placeholder</div>
const OrdersView = () => <div className={styles.view}>Orders view placeholder</div>
const PaymentsView = () => <div className={styles.view}>Payments view placeholder</div>
const ReportsView = () => <div className={styles.view}>Reports view placeholder</div>
const AiView = () => <div className={styles.view}>AI view placeholder</div>
const ProfilesView = () => <div className={styles.view}>Profiles view placeholder</div>
const ConnectionsView = () => <div className={styles.view}>Connections view placeholder</div>
const SettingsView = () => <div className={styles.view}>Settings view placeholder</div>

export default BusinessModule
