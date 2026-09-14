'use client'

import { useMemo } from 'react'
import { useBusinessStore } from '../useBusinessStore'
import styles from './views.module.css'
import type { LotStatus } from '@/lib/business/types'

const STATUS_COLOR: Record<LotStatus, string> = {
  arrived: '#6ee7b7',
  active: '#38bdf8',
  low_stock: '#facc15',
  cleared: '#a78bfa',
  dead_stock: '#f87171',
}

/** LotsView — the garment roll inventory. Columns: design, date, metres on
 *  hand (top / bottom / dupatta), opening, remaining, status badge + low-stock %.
 *  Action: open the lot modal to edit usage. Status is computed live from
 *  remaining vs opening, so the badge and the threshold ring stay in sync.
 */
export default function LotsView() {
  const {
    lots, lotsLoading, lotsError, lotStatusFilter, setLotStatusFilter,
    lotSearchQuery, setLotSearchQuery, isLotModalOpen, setLotModalOpen,
    setEditingLot, fetchLotComponents, lotComponents,
  } = useBusinessStore()

  const filtered = useMemo(() => {
    let rows = lots
    if (lotStatusFilter !== 'all') rows = rows.filter((l) => l.status === lotStatusFilter)
    if (lotSearchQuery.trim()) {
      const q = lotSearchQuery.toLowerCase()
      rows = rows.filter((l) => l.item_name.toLowerCase().includes(q) || l.design_no.toLowerCase().includes(q))
    }
    return rows
  }, [lots, lotStatusFilter, lotSearchQuery])

  if (lotsError) return <p className={styles.error}>⚠ {lotsError}</p>

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.filters}>
          <input
            className={styles.search}
            placeholder="Search item / design…"
            value={lotSearchQuery}
            onChange={(e) => setLotSearchQuery(e.target.value)}
          />
          <select
            className={styles.select}
            value={lotStatusFilter}
            onChange={(e) => setLotStatusFilter(e.target.value as string)}
          >
            <option value="all">All statuses</option>
            <option value="arrived">Arrived</option>
            <option value="active">Active</option>
            <option value="low_stock">Low stock</option>
            <option value="cleared">Cleared</option>
            <option value="dead_stock">Dead stock</option>
          </select>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => { setEditingLot(null); setLotModalOpen(true) }}
          aria-label="Add lot"
        >
          ＋ Add lot
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Item / Design</th>
              <th>Date</th>
              <th>Opening (T/B/D)</th>
              <th>Remaining (T/B/D)</th>
              <th>Low stock</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lotsLoading ? (
              <tr><td colSpan={7} className={styles.skeleton}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className={styles.empty}>No lots yet. Add one to begin.</td></tr>
            ) : (
              filtered.map((lot) => {
                const min = Math.min(lot.top_remaining, lot.bottom_remaining, lot.dupatta_remaining)
                const pct = Math.max(0, Math.round((min / Math.max(1, Math.min(lot.opening_top, lot.opening_bottom, lot.opening_dupatta)) * 100)))
                return (
                  <tr key={lot.id}>
                    <td className={styles.cellBold}>
                      {lot.item_name}
                      <span className={styles.muted}>#{lot.design_no}</span>
                    </td>
                    <td className={styles.muted}>{new Date(lot.date_arrived).toLocaleDateString()}</td>
                    <td className={styles.muted}>
                      {lot.opening_top}/{lot.opening_bottom}/{lot.opening_dupatta}
                    </td>
                    <td className={styles.muted}>
                      {lot.top_remaining}/{lot.bottom_remaining}/{lot.dupatta_remaining}
                    </td>
                    <td className={styles.muted}>{pct}%</td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{ color: STATUS_COLOR[lot.status], borderColor: STATUS_COLOR[lot.status] + '44' }}
                      >
                        {lot.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={styles.cellActions}>
                      <button
                        className={styles.iconBtn}
                        onClick={async () => {
                          setEditingLot(lot)
                          setLotModalOpen(true)
                          await fetchLotComponents(lot.id)
                        }}
                        aria-label="Edit lot"
                      >
                        ✎
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
