'use client'

import { useMemo } from 'react'
import { useBusinessStore } from '../useBusinessStore'
import styles from './views.module.css'

/** PartiesView — customer and supplier registry. Columns: name, city, contact, status.
 *  Action: open modal to edit party details. Status is active/inactive.
 */
export default function PartiesView() {
  const {
    parties, partiesLoading, partiesError, isPartyModalOpen, setPartyModalOpen,
    setEditingParty, fetchParties, editingParty,
  } = useBusinessStore()

  const filtered = useMemo(() => {
    let rows = parties
    if (partiesError) return []
    return rows
  }, [parties, partiesError])

  if (partiesLoading) return <p className={styles.loading}>Loading parties…</p>
  if (partiesError) return <p className={styles.error}>⚠ {partiesError}</p>

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.filters}>
          <input
            className={styles.search}
            placeholder="Search party…"
            value={''}
            onChange={(e) => { /* no search yet */ }}
          />
        </div>
        <button
          className={styles.addBtn}
          onClick={() => { setEditingParty(null); setPartyModalOpen(true) }}
          aria-label="Add party"
        >
          ＋ Add party
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((party) => (
              <tr key={party.id}>
                <td className={styles.cellBold}>{party.party_name}</td>
                <td className={styles.muted}>{party.city || '—'}</td>
                <td className={styles.muted}>
                  {party.contact_person || party.email || party.phone || '—'}
                </td>
                <td className={styles.muted}>
                  {party.is_active ? '✅ Active' : '❌ Inactive'}
                </td>
                <td className={styles.cellActions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => { setEditingParty(party); setPartyModalOpen(true) }}
                    aria-label="Edit party"
                  >
                    ✎
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}