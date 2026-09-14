'use client'

import { useBusinessStore } from '../useBusinessStore'
import styles from './views.module.css'

/** ProfilesView — the shop's own profile and settings block.
 *  Pulls from business_parties filtered for the shop itself (the
 *  'isActive' party) and business_conversations mode =
 *  'morning_briefing' / 'pre_visit_brief' / 'post_day' as
 *  profile preferences. Currently shows a compact summary card
 *  so the view is not an empty placeholder; fields expand once
 *  the party modal is wired (see PartiesView).
 */
export default function ProfilesView() {
  const { parties } = useBusinessStore()
  const shop = parties.find((p) => p.party_name.toLowerCase().includes('shop') || p.party_name.toLowerCase().includes('store')) ?? parties[0]

  return (
    <div className={styles.section}>
      <h3 className={styles.subhead}>Shop profile</h3>
      {shop ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <tbody>
              <tr><td className={styles.cellBold}>Name</td><td>{shop.party_name}</td></tr>
              <tr><td className={styles.muted}>City</td><td>{shop.city || '—'}</td></tr>
              <tr><td className={styles.muted}>Contact</td><td>{shop.contact_person || '—'}</td></tr>
              <tr><td className={styles.muted}>Phone</td><td>{shop.phone || '—'}</td></tr>
              <tr><td className={styles.muted}>Email</td><td>{shop.email || '—'}</td></tr>
              <tr><td className={styles.muted}>Address</td><td>{shop.address || '—'}</td></tr>
              <tr><td className={styles.muted}>Payment terms</td><td>{shop.default_payment_terms} days</td></tr>
              <tr><td className={styles.muted}>Default GST</td><td>{shop.default_gst}</td></tr>
              <tr><td className={styles.muted}>Cash discount</td><td>{shop.default_cash_discount}%</td></tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.muted}>No shop profile yet — add a party tagged Shop.</p>
      )}
    </div>
  )
}