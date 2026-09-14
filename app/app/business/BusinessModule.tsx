'use client'

import { useEffect } from 'react'
import { useBusinessStore } from '@/lib/business/store'
import styles from './business.module.css'

// View components
import LotsView from './views/LotsView'
import PartiesView from './views/PartiesView'
import OrdersView from './views/OrdersView'
import PaymentsView from './views/PaymentsView'
import ReportsView from './views/ReportsView'
import AiView from './views/AiView'
import ProfilesView from './views/ProfilesView'
import ConnectionsView from './views/ConnectionsView'
import SettingsView from './views/SettingsView'

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

export default BusinessModule
