'use client'

import { useMemo } from 'react'
import { useBusinessStore } from '../useBusinessStore'
import styles from './views.module.css'

/** PaymentsView — payment register tied to orders + parties. */
export default function PaymentsView() {
  const {
    payments, orders, paymentsLoading, paymentsError, isPaymentModalOpen, setPaymentModalOpen,
    setEditingPayment,
  } = useBusinessStore()

  const orderMap = useMemo(() => {
    const m = new Map<string, string>()
    orders.forEach((o) => m.set(o.id, o.party_id.slice(0, 6)))
    return m
  }, [orders])

  if (paymentsLoading) return <p className={styles.loading}>Loading payments…</p>
  if (paymentsError) return <p className={styles.error}>⚠ {paymentsError}</p>

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.filters}>
          <input className={styles.search} placeholder="Search payments…" />
        </div>
        <button className={styles.addBtn} onClick={() => setPaymentModalOpen(true)} aria-label="Add payment">
          ＋ Add payment
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Party</th>
              <th>Amount ₹</th>
              <th>Method</th>
              <th>Ref</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan={6} className={styles.empty}>No payments yet.</td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id}>
                  <td className={styles.muted}>{new Date(p.payment_date).toLocaleDateString()}</td>
                  <td className={styles.muted}>{orderMap.get(p.order_id) ?? p.order_id.slice(0, 6)}</td>
                  <td className={styles.cellBold}>₹{p.amount.toLocaleString()}</td>
                  <td className={styles.muted}>{p.payment_method}</td>
                  <td className={styles.muted}>{p.reference_number || '—'}</td>
                  <td className={styles.cellActions}>
                    <button
                      className={styles.iconBtn}
                      onClick={() => { setEditingPayment(p); setPaymentModalOpen(true) }}
                      aria-label="Edit payment"
                    >
                      ✎
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}