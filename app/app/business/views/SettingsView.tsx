'use client'

import { useBusinessStore } from '../useBusinessStore'
import styles from './views.module.css'

/** SettingsView — module-level configuration. Taps into the rates
 *  collection (per-party rate defaults live here until a rate
 *  manager is split out) and surfaces a reset button for the local
 *  store. No API keys here — server-side config stays in env vars.
 */
export default function SettingsView() {
  const { rates } = useBusinessStore()

  return (
    <div className={styles.section}>
      <h3 className={styles.subhead}>Business settings</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Party</th>
              <th>Item</th>
              <th>Design</th>
              <th>₹/m</th>
              <th>Default</th>
            </tr>
          </thead>
          <tbody>
            {rates.length === 0 ? (
              <tr><td colSpan={5} className={styles.empty}>No rate cards yet — add one from the Rates section.</td></tr>
            ) : (
              rates.map((r) => (
                <tr key={r.id}>
                  <td className={styles.muted}>{r.party_id.slice(0, 8)}</td>
                  <td>{r.item_name}</td>
                  <td className={styles.muted}>{r.design_no}</td>
                  <td className={styles.cellBold}>₹{r.price_per_metre}</td>
                  <td className={styles.muted}>{r.is_default ? '✅' : ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}