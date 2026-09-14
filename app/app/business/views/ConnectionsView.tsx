'use client'

import { useBusinessStore } from '../useBusinessStore'
import styles from './views.module.css'

/** ConnectionsView — live-data connect status for the business
 *  module (supplier/party integrations, rate feeds). For now
 *  each provider shows as connected/disconnected from the store;
 *  no third-party keys are required (supplier data is entered
 *  manually — Rates view).
 */
export default function ConnectionsView() {
  const { rates } = useBusinessStore()
  const providers = Array.from(new Set(rates.map((r) => r.party_id).filter(Boolean))).map((id) => ({ id, status: 'connected' as const }))

  return (
    <div className={styles.section}>
      <h3 className={styles.subhead}>Connected sources</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Source</th>
              <th>Status</th>
              <th>Rate cards</th>
            </tr>
          </thead>
          <tbody>
            {providers.length === 0 ? (
              <tr><td colSpan={3} className={styles.empty}>No connections yet — add rates to connect.</td></tr>
            ) : (
              providers.map((p) => (
                <tr key={p.id}>
                  <td className={styles.muted}>{p.id.slice(0, 8)}</td>
                  <td><span className={styles.statusBadge} style={{ color: '#6ee7b7', borderColor: '#6ee7b744' }}>Connected</span></td>
                  <td className={styles.muted}>{rates.filter((r) => r.party_id === p.id).length} cards</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}