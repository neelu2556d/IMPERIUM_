'use client'

import { useMemo, useState } from 'react'
import { useBusinessStore } from '../useBusinessStore'
import styles from './views.module.css'
import type { OrderStatus } from '@/lib/business/types'

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: '#facc15',
  partially_paid: '#38bdf8',
  paid: '#6ee7b7',
  cancelled: '#f87171',
}

/** OrdersView — sale invoices with per-party total + status. */
export default function OrdersView() {
  const {
    orders, orderItems, ordersLoading, ordersError, isOrderModalOpen, setOrderModalOpen,
    setEditingLot, fetchOrderItems,
  } = useBusinessStore()
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let rows = orders
    if (ordersError) return []
    return rows
  }, [orders, ordersError])

  const items = (orderId: string) => orderItems[orderId] ?? []

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.filters}>
          <input className={styles.search} placeholder="Search orders…" />
        </div>
        <button className={styles.addBtn} onClick={() => setOrderModalOpen(true)} aria-label="Add order">
          ＋ New order
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Party</th>
              <th>Date</th>
              <th>Due</th>
              <th>Items</th>
              <th>Total ₹</th>
              <th>Received</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ordersLoading ? (
              <tr><td colSpan={8} className={styles.skeleton}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className={styles.empty}>No orders yet.</td></tr>
            ) : (
              filtered.map((order) => {
                const its = items(order.id)
                const total = its.reduce((s, i) => s + i.amount, 0) || order.total_amount
                const received = order.amount_received || 0
                const due = total - received
                return (
                  <tr key={order.id}>
                    <td className={styles.muted}>#{order.party_id.slice(0, 6)}</td>
                    <td className={styles.muted}>{new Date(order.order_date).toLocaleDateString()}</td>
                    <td className={styles.muted}>{new Date(order.due_date).toLocaleDateString()}</td>
                    <td className={styles.muted}>{its.length || '—'}</td>
                    <td className={styles.cellBold}>₹{total.toLocaleString()}</td>
                    <td className={styles.muted}>₹{received.toLocaleString()}</td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{ color: STATUS_COLOR[order.status], borderColor: STATUS_COLOR[order.status] + '44' }}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={styles.cellActions}>
                      <button
                        className={styles.iconBtn}
                        onClick={async () => { setOpenId(openId === order.id ? null : order.id); await fetchOrderItems(order.id) }}
                        aria-label="Toggle order items"
                      >
                        {openId === order.id ? '▼' : '▶'}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {openId && (
        <div className={styles.itemsPanel}>
          <h3 className={styles.subhead}>Order items</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Design</th>
                <th>T/B/D m</th>
                <th>₹/m</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items(openId).map((it) => (
                <tr key={it.id}>
                  <td>{it.item_name}</td>
                  <td className={styles.muted}>{it.design_no}</td>
                  <td className={styles.muted}>{it.top_metre}/{it.bottom_metre}/{it.dupatta_metre}</td>
                  <td className={styles.muted}>₹{it.price_per_metre}</td>
                  <td className={styles.cellBold}>₹{it.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}