'use client'

import { useMemo } from 'react'
import { useBusinessStore } from '../useBusinessStore'
import styles from './views.module.css'

/** ReportsView — auto-computed summary cards pulled from the same
 *  store (lots, parties, orders, payments). All numbers are derived
 *  from the user's data, so it's a live read, not a placeholder.
 */
export default function ReportsView() {
  const { lots, orders, payments, parties } = useBusinessStore()

  const summary = useMemo(() => {
    const totalOrders = orders.length
    const totalDue = orders.reduce((s, o) => s + (o.total_amount || 0) - (o.amount_received || 0), 0)
    const totalPaid = orders.reduce((s, o) => s + (o.amount_received || 0), 0)
    const totalPayments = payments.reduce((s, p) => s + (p.amount || 0), 0)
    const lowStock = lots.filter((l) => l.status === 'low_stock' || l.status === 'dead_stock').length
    const activeParties = parties.filter((p) => p.is_active).length
    return { totalOrders, totalDue, totalPaid, totalPayments, lowStock, activeParties }
  }, [lots, orders, payments, parties])

  const cards = [
    { label: 'Open orders', value: summary.totalOrders.toString() },
    { label: 'Received', value: `₹${summary.totalPaid.toLocaleString()}` },
    { label: 'Outstanding', value: `₹${summary.totalDue.toLocaleString()}` },
    { label: 'Payments logged', value: `₹${summary.totalPayments.toLocaleString()}` },
    { label: 'Low/dead stock', value: summary.lowStock.toString() },
    { label: 'Active parties', value: summary.activeParties.toString() },
  ]

  return (
    <div className={styles.section}>
      <div className={styles.cardsGrid}>
        {cards.map((c) => (
          <div className={styles.card} key={c.label}>
            <div className={styles.cardValue}>{c.value}</div>
            <div className={styles.cardLabel}>{c.label}</div>
          </div>
        ))}
      </div>
      <p className={styles.muted}>
        Reports generate from your live data — every lot, order, party and
        payment you add updates these totals instantly. Detailed report
        periods (monthly/quarterly) come next.
      </p>
    </div>
  )
}