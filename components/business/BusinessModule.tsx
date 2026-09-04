'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isBusinessOwner } from '@/lib/business/auth'
import {
  type BusinessState,
  type BusinessLot,
  type BusinessParty,
  type BusinessOrder,
  type CreateLotPayload,
  type CreateOrderPayload,
  type CreatePartyPayload,
  DEFAULT_BUSINESS_STATE,
} from '@/lib/business/types'
import styles from './BusinessModule.module.css'

const STORAGE_KEY = 'imperium_business_v1'

interface BusinessModuleProps {
  tab: BusinessState['activeTab']
  onTabChange: (tab: BusinessState['activeTab']) => void
}

export default function BusinessModule({ tab, onTabChange }: BusinessModuleProps) {
  const supabase = createClient()
  const [state, setState] = useState<BusinessState>(DEFAULT_BUSINESS_STATE)
  const [isReady, setIsReady] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [showLotForm, setShowLotForm] = useState(false)
  const [showPartyForm, setShowPartyForm] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Load on mount
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (cancelled) return

        if (!user || !isBusinessOwner(user.email)) {
          setIsAuthorized(false)
          setIsReady(true)
          return
        }

        setIsAuthorized(true)

        // Load all data in parallel
        const [lotsRes, partiesRes, ordersRes, collectionsRes] = await Promise.all([
          supabase.from('business_lots').select('*').eq('user_id', user.id).order('date_arrived', { ascending: false }),
          supabase.from('business_parties').select('*').eq('user_id', user.id).order('name'),
          supabase.from('business_orders').select('*, lot:business_lots(item_name, d_no), party:business_parties(name)').eq('user_id', user.id).order('order_date', { ascending: false }),
          supabase.from('business_collection_register').select('*, party:business_parties(name)').order('due_date'),
        ])

        if (cancelled) return

        const lots = lotsRes.data ?? []
        const parties = partiesRes.data ?? []
        const orders = ordersRes.data ?? []
        const collections = collectionsRes.data ?? []

        setState((s) => ({
          ...s,
          lots: lots as BusinessLot[],
          parties: parties as BusinessParty[],
          orders: orders as BusinessOrder[],
          collections: collections as any[],
          loading: { lots: false, orders: false, parties: false, collections: false },
        }))

        // Persist to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ lots, parties, orders, collections }))
        } catch {}

        setIsReady(true)
      } catch (err) {
        if (cancelled) return
        // Fallback to localStorage
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw) {
            const parsed = JSON.parse(raw)
            setState((s) => ({
              ...s,
              lots: parsed.lots ?? [],
              parties: parsed.parties ?? [],
              orders: parsed.orders ?? [],
              collections: parsed.collections ?? [],
            }))
          }
        } catch {}
        setIsReady(true)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [supabase])

  // Tab navigation
  const tabs = [
    { id: 'lots' as const, label: 'Lots' },
    { id: 'orders' as const, label: 'Orders' },
    { id: 'stock' as const, label: 'Stock' },
    { id: 'sales' as const, label: 'Sales' },
    { id: 'party' as const, label: 'Party' },
    { id: 'collection' as const, label: 'Collection' },
    { id: 'reports' as const, label: 'Reports' },
    { id: 'imperium' as const, label: 'Imperium AI' },
  ]

  // Render the active tab content
  function renderTabContent() {
    switch (tab) {
      case 'lots':
        return <LotsTab lots={state.lots} onAddLot={() => setShowLotForm(true)} />
      case 'orders':
        return <OrdersTab
          orders={state.orders}
          lots={state.lots}
          parties={state.parties}
          onAddOrder={() => setShowOrderForm(true)}
        />
      case 'stock':
        return <StockTab lots={state.lots} />
      case 'sales':
        return <SalesTab orders={state.orders} />
      case 'party':
        return <PartyTab parties={state.parties} onAddParty={() => setShowPartyForm(true)} />
      case 'collection':
        return <CollectionTab collections={state.collections} />
      case 'reports':
        return <ReportsTab />
      case 'imperium':
        return <ImperiumTab />
      default:
        return null
    }
  }

  if (!isAuthorized) {
    return (
      <div className={styles.unauthorized}>
        <div className={styles.lockIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h3>Access Restricted</h3>
        <p>This module is available only to a single authorized user.</p>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading business data...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Tab bar */}
      <div className={styles.tabBar}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.activeTab : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={styles.content}>
        {renderTabContent()}
      </div>

      {/* Modals */}
      {showLotForm && (
        <LotFormModal
          onClose={() => setShowLotForm(false)}
          onSave={async (payload) => {
            setFormLoading(true)
            setFormError(null)
            try {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) throw new Error('Not authenticated')
              const { data, error } = await supabase
                .from('business_lots')
                .insert({ ...payload, user_id: user.id })
                .select()
                .single()
              if (error) throw error
              setState((s) => ({ ...s, lots: [data as BusinessLot, ...s.lots] }))
              setShowLotForm(false)
            } catch (e: any) {
              setFormError(e.message)
            } finally {
              setFormLoading(false)
            }
          }}
          loading={formLoading}
          error={formError}
        />
      )}

      {showPartyForm && (
        <PartyFormModal
          onClose={() => setShowPartyForm(false)}
          onSave={async (payload) => {
            setFormLoading(true)
            setFormError(null)
            try {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) throw new Error('Not authenticated')
              const { data, error } = await supabase
                .from('business_parties')
                .insert({ ...payload, user_id: user.id })
                .select()
                .single()
              if (error) throw error
              setState((s) => ({
                ...s,
                parties: [...s.parties, data as BusinessParty].sort((a, b) => a.name.localeCompare(b.name)),
              }))
              setShowPartyForm(false)
            } catch (e: any) {
              setFormError(e.message)
            } finally {
              setFormLoading(false)
            }
          }}
          loading={formLoading}
          error={formError}
        />
      )}

      {showOrderForm && (
        <OrderFormModal
          lots={state.lots}
          parties={state.parties}
          onClose={() => setShowOrderForm(false)}
          onSave={async (payload) => {
            setFormLoading(true)
            setFormError(null)
            try {
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) throw new Error('Not authenticated')

              // Calculate totals
              const totalMetres = (payload.top_quantity + payload.bottom_quantity + payload.dupatta_quantity) * payload.colours
              const totalAmount = (payload.top_quantity * payload.top_rate + payload.bottom_quantity * payload.bottom_rate + payload.dupatta_quantity * payload.dupatta_rate) * payload.colours
              const discountAmount = totalAmount * (payload.discount_percent ?? 0) / 100
              const afterDiscount = totalAmount - discountAmount
              const gstAmount = payload.gst ? afterDiscount * 0.05 : 0
              const netAmount = afterDiscount + gstAmount
              const orderDate = new Date()
              const dueDate = new Date()
              dueDate.setDate(dueDate.getDate() + (payload.payment_days ?? 45))

              const { data, error } = await supabase
                .from('business_orders')
                .insert({
                  user_id: user.id,
                  lot_id: payload.lot_id,
                  party_id: payload.party_id,
                  colours: payload.colours,
                  top_quantity: payload.top_quantity,
                  bottom_quantity: payload.bottom_quantity,
                  dupatta_quantity: payload.dupatta_quantity,
                  top_rate: payload.top_rate,
                  bottom_rate: payload.bottom_rate,
                  dupatta_rate: payload.dupatta_rate,
                  discount_percent: payload.discount_percent ?? 0,
                  gst: payload.gst ?? true,
                  payment_days: payload.payment_days ?? 45,
                  total_metres: totalMetres,
                  total_amount: totalAmount,
                  discount_amount: discountAmount,
                  after_discount: afterDiscount,
                  gst_amount: gstAmount,
                  net_amount: netAmount,
                  due_date: dueDate.toISOString(),
                  status: 'pending',
                })
                .select('*, lot:business_lots(item_name, d_no), party:business_parties(name)')
                .single()

              if (error) throw error

              // Auto-populate sales register
              await supabase.from('business_sales_register').insert({
                order_id: data.id,
                amount: totalAmount,
                gst_rate: payload.gst ? 5 : 0,
                net_amount: netAmount,
              })

              // Auto-populate collection register
              await supabase.from('business_collection_register').insert({
                party_id: payload.party_id,
                invoice_date: orderDate.toISOString(),
                due_date: dueDate.toISOString(),
                amount: netAmount,
                status: 'pending',
              })

              setState((s) => ({ ...s, orders: [data as BusinessOrder, ...s.orders] }))
              setShowOrderForm(false)
            } catch (e: any) {
              setFormError(e.message)
            } finally {
              setFormLoading(false)
            }
          }}
          loading={formLoading}
          error={formError}
        />
      )}
    </div>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function LotsTab({ lots, onAddLot }: { lots: BusinessLot[]; onAddLot: () => void }) {
  const statusColors: Record<string, string> = {
    arrived: '#3b82f6',
    active: '#6ee7b7',
    low_stock: '#f59e0b',
    cleared: '#94a3b8',
    dead_stock: '#ef4444',
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h3>Lots</h3>
        <button className={styles.addButton} onClick={onAddLot}>
          + New Lot
        </button>
      </div>
      {lots.length === 0 ? (
        <div className={styles.empty}>
          <p>No lots yet. Create your first lot to get started.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {lots.map((lot) => (
            <div key={lot.id} className={styles.lotCard}>
              <div className={styles.lotHeader}>
                <span className={styles.lotName}>{lot.item_name}</span>
                <span
                  className={styles.statusBadge}
                  style={{ background: statusColors[lot.status] + '22', color: statusColors[lot.status] }}
                >
                  {lot.status.replace('_', ' ')}
                </span>
              </div>
              <div className={styles.lotMeta}>
                <span>D.No: {lot.d_no}</span>
                <span>{new Date(lot.date_arrived).toLocaleDateString()}</span>
              </div>
              <div className={styles.lotStock}>
                <div className={styles.stockItem}>
                  <span className={styles.stockLabel}>Top</span>
                  <span className={styles.stockValue}>{lot.top_metres}m</span>
                </div>
                <div className={styles.stockItem}>
                  <span className={styles.stockLabel}>Bottom</span>
                  <span className={styles.stockValue}>{lot.bottom_metres}m</span>
                </div>
                <div className={styles.stockItem}>
                  <span className={styles.stockLabel}>Dupatta</span>
                  <span className={styles.stockValue}>{lot.dupatta_metres}m</span>
                </div>
              </div>
              <div className={styles.lotTotal}>
                Total: <strong>{((lot.top_metres || 0) + (lot.bottom_metres || 0) + (lot.dupatta_metres || 0)).toLocaleString()}m</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OrdersTab({ orders, lots, parties, onAddOrder }: { orders: BusinessOrder[]; lots: BusinessLot[]; parties: BusinessParty[]; onAddOrder: () => void }) {
  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h3>Orders</h3>
        <button className={styles.addButton} onClick={onAddOrder}>
          + Log Order
        </button>
      </div>
      {orders.length === 0 ? (
        <div className={styles.empty}>
          <p>No orders yet. Log your first order to start tracking.</p>
        </div>
      ) : (
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Lot</th>
                <th>Party</th>
                <th>Colours</th>
                <th>Metres</th>
                <th>Amount</th>
                <th>GST</th>
                <th>Net</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td>{order.lot?.item_name || '—'}</td>
                  <td>{order.party?.name || '—'}</td>
                  <td>{order.colours}</td>
                  <td>{order.total_metres?.toLocaleString()}</td>
                  <td>₹{order.total_amount?.toLocaleString()}</td>
                  <td>₹{order.gst_amount?.toLocaleString()}</td>
                  <td><strong>₹{order.net_amount?.toLocaleString()}</strong></td>
                  <td>{new Date(order.due_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`${styles.orderStatus} ${styles[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StockTab({ lots }: { lots: BusinessLot[] }) {
  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h3>Stock Register</h3>
      </div>
      {lots.length === 0 ? (
        <div className={styles.empty}><p>No lots to display.</p></div>
      ) : (
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Lot</th>
                <th>D.No</th>
                <th>Status</th>
                <th>Top</th>
                <th>Bottom</th>
                <th>Dupatta</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => {
                const total = (lot.top_metres || 0) + (lot.bottom_metres || 0) + (lot.dupatta_metres || 0)
                return (
                  <tr key={lot.id}>
                    <td>{lot.item_name}</td>
                    <td>{lot.d_no}</td>
                    <td>{lot.status}</td>
                    <td>{lot.top_metres}m</td>
                    <td>{lot.bottom_metres}m</td>
                    <td>{lot.dupatta_metres}m</td>
                    <td><strong>{total.toLocaleString()}m</strong></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SalesTab({ orders }: { orders: BusinessOrder[] }) {
  const totalSales = orders.reduce((sum, o) => sum + (o.net_amount || 0), 0)
  const totalMetres = orders.reduce((sum, o) => sum + (o.total_metres || 0), 0)

  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h3>Sales Register</h3>
      </div>
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Sales</span>
          <span className={styles.summaryValue}>₹{totalSales.toLocaleString()}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Metres</span>
          <span className={styles.summaryValue}>{totalMetres.toLocaleString()}m</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Orders</span>
          <span className={styles.summaryValue}>{orders.length}</span>
        </div>
      </div>
      {orders.length === 0 ? (
        <div className={styles.empty}><p>No sales recorded yet.</p></div>
      ) : (
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Party</th>
                <th>Metres</th>
                <th>Amount</th>
                <th>GST</th>
                <th>Net Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td>{order.party?.name || '—'}</td>
                  <td>{order.total_metres?.toLocaleString()}m</td>
                  <td>₹{order.total_amount?.toLocaleString()}</td>
                  <td>₹{order.gst_amount?.toLocaleString()}</td>
                  <td><strong>₹{order.net_amount?.toLocaleString()}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PartyTab({ parties, onAddParty }: { parties: BusinessParty[]; onAddParty: () => void }) {
  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h3>Party Ledger</h3>
        <button className={styles.addButton} onClick={onAddParty}>
          + Add Party
        </button>
      </div>
      {parties.length === 0 ? (
        <div className={styles.empty}><p>No parties added yet.</p></div>
      ) : (
        <div className={styles.grid}>
          {parties.map((party) => (
            <div key={party.id} className={styles.partyCard}>
              <div className={styles.partyName}>{party.name}</div>
              <div className={styles.partyMeta}>
                {party.email && <span>{party.email}</span>}
                <span>Payment: {party.default_payment_days || 30} days</span>
              </div>
              <div className={styles.partyRates}>
                <div><span className={styles.rateLabel}>Top</span> ₹{party.top_rate}/m</div>
                <div><span className={styles.rateLabel}>Bottom</span> ₹{party.bottom_rate}/m</div>
                <div><span className={styles.rateLabel}>Dupatta</span> ₹{party.dupatta_rate}/m</div>
              </div>
              {party.discount_percent > 0 && (
                <div className={styles.partyDiscount}>
                  Discount: {party.discount_percent}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CollectionTab({ collections }: { collections: any[] }) {
  const pending = collections.filter((c) => c.status === 'pending')
  const totalPending = pending.reduce((sum, c) => sum + (c.amount || 0), 0)

  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h3>Collection Register</h3>
      </div>
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Pending</span>
          <span className={styles.summaryValue}>₹{totalPending.toLocaleString()}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Due Invoices</span>
          <span className={styles.summaryValue}>{pending.length}</span>
        </div>
      </div>
      {collections.length === 0 ? (
        <div className={styles.empty}><p>No collections tracked yet.</p></div>
      ) : (
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th>Party</th>
                <th>Amount</th>
                <th>Invoice Date</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((col) => (
                <tr key={col.id}>
                  <td>{col.party?.name || '—'}</td>
                  <td>₹{col.amount?.toLocaleString()}</td>
                  <td>{new Date(col.invoice_date).toLocaleDateString()}</td>
                  <td>{new Date(col.due_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`${styles.orderStatus} ${styles[col.status]}`}>
                      {col.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ReportsTab() {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'half_yearly' | 'yearly'>('monthly')
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/business/reports?period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        setReport(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [period])

  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h3>Reports</h3>
        <div className={styles.periodSelector}>
          {(['monthly', 'quarterly', 'half_yearly', 'yearly'] as const).map((p) => (
            <button
              key={p}
              className={`${styles.periodBtn} ${period === p ? styles.activePeriod : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : report ? (
        <div className={styles.reports}>
          {/* Summary */}
          <div className={styles.summaryRow}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Total Orders</span>
              <span className={styles.summaryValue}>{report.summary?.total_orders ?? 0}</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Total Metres</span>
              <span className={styles.summaryValue}>{(report.summary?.total_metres ?? 0).toLocaleString()}m</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Total Sales</span>
              <span className={styles.summaryValue}>₹{(report.summary?.total_net ?? 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Per Day Sale */}
          <div className={styles.reportSection}>
            <h4>Per Day Sale</h4>
            {report.per_day_sale?.length > 0 ? (
              <div className={styles.barChart}>
                {report.per_day_sale.map((day: any) => (
                  <div key={day.date} className={styles.barItem}>
                    <div
                      className={styles.bar}
                      style={{ height: `${Math.min(100, (day.total_amount / Math.max(...report.per_day_sale.map((d: any) => d.total_amount))) * 100)}%` }}
                      title={`₹${day.total_amount.toLocaleString()}`}
                    />
                    <span className={styles.barLabel}>{day.date.split('-')[2]}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>No data for this period.</p>
            )}
          </div>

          {/* Party Wise */}
          <div className={styles.reportSection}>
            <h4>Party Wise Breakdown</h4>
            {report.party_wise?.length > 0 ? (
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr><th>Party</th><th>Orders</th><th>Metres</th><th>Amount</th><th>%</th></tr>
                  </thead>
                  <tbody>
                    {report.party_wise.map((row: any, i: number) => (
                      <tr key={i}>
                        <td>{row.party_name}</td>
                        <td>{row.orders}</td>
                        <td>{row.total_metres?.toLocaleString()}m</td>
                        <td>₹{row.total_amount?.toLocaleString()}</td>
                        <td>{row.percent_of_sale}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.empty}>No data for this period.</p>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.empty}><p>Failed to load reports.</p></div>
      )}
    </div>
  )
}

function ImperiumTab() {
  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h3>Imperium AI</h3>
      </div>
      <div className={styles.imperiumGrid}>
        <div className={styles.imperiumCard}>
          <div className={styles.imperiumIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h4>Morning Briefing</h4>
          <p>Stock alerts, party visit priorities, and daily targets.</p>
          <button className={styles.aiButton}>Generate Briefing</button>
        </div>
        <div className={styles.imperiumCard}>
          <div className={styles.imperiumIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <h4>Post-Order Insights</h4>
          <p>AI analysis after each order logged.</p>
          <button className={styles.aiButton}>Get Insights</button>
        </div>
        <div className={styles.imperiumCard}>
          <div className={styles.imperiumIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
          </div>
          <h4>Monthly Analysis</h4>
          <p>Deep dive into monthly performance with AI recommendations.</p>
          <button className={styles.aiButton}>Analyze Now</button>
        </div>
        <div className={styles.imperiumCard}>
          <div className={styles.imperiumIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h4>Pre-Visit Brief</h4>
          <p>Party-specific brief before visiting.</p>
          <button className={styles.aiButton}>Generate Brief</button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Form Modals
// =============================================================================

function LotFormModal({ onClose, onSave, loading, error }: { onClose: () => void; onSave: (p: CreateLotPayload) => void; loading: boolean; error: string | null }) {
  const [itemName, setItemName] = useState('')
  const [dNo, setDNo] = useState('')
  const [topMetres, setTopMetres] = useState('')
  const [bottomMetres, setBottomMetres] = useState('')
  const [dupattaMetres, setDupattaMetres] = useState('')
  const [dateArrived, setDateArrived] = useState(new Date().toISOString().split('T')[0])

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>New Lot</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label>Item Name *</label>
            <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g., Silk Saree" />
          </div>
          <div className={styles.formGroup}>
            <label>D.No *</label>
            <input value={dNo} onChange={(e) => setDNo(e.target.value)} placeholder="e.g., D-001" />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Top (metres)</label>
              <input type="number" value={topMetres} onChange={(e) => setTopMetres(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Bottom (metres)</label>
              <input type="number" value={bottomMetres} onChange={(e) => setBottomMetres(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Dupatta (metres)</label>
              <input type="number" value={dupattaMetres} onChange={(e) => setDupattaMetres(e.target.value)} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Date Arrived</label>
            <input type="date" value={dateArrived} onChange={(e) => setDateArrived(e.target.value)} />
          </div>
          {error && <div className={styles.formError}>{error}</div>}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            onClick={() => {
              if (!itemName || !dNo) return
              onSave({
                item_name: itemName,
                d_no: dNo,
                top_metres: Number(topMetres) || 0,
                bottom_metres: Number(bottomMetres) || 0,
                dupatta_metres: Number(dupattaMetres) || 0,
                date_arrived: dateArrived,
              })
            }}
            disabled={loading || !itemName || !dNo}
          >
            {loading ? 'Saving...' : 'Save Lot'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PartyFormModal({ onClose, onSave, loading, error }: { onClose: () => void; onSave: (p: CreatePartyPayload) => void; loading: boolean; error: string | null }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topRate, setTopRate] = useState('')
  const [bottomRate, setBottomRate] = useState('')
  const [dupattaRate, setDupattaRate] = useState('')
  const [paymentDays, setPaymentDays] = useState('30')

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Add Party</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label>Party Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., ABC Textiles" />
          </div>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Top Rate (₹/m)</label>
              <input type="number" value={topRate} onChange={(e) => setTopRate(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Bottom Rate (₹/m)</label>
              <input type="number" value={bottomRate} onChange={(e) => setBottomRate(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Dupatta Rate (₹/m)</label>
              <input type="number" value={dupattaRate} onChange={(e) => setDupattaRate(e.target.value)} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Payment Days</label>
            <input type="number" value={paymentDays} onChange={(e) => setPaymentDays(e.target.value)} />
          </div>
          {error && <div className={styles.formError}>{error}</div>}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            onClick={() => {
              if (!name) return
              onSave({
                name,
                email: email || undefined,
                top_rate: Number(topRate) || 0,
                bottom_rate: Number(bottomRate) || 0,
                dupatta_rate: Number(dupattaRate) || 0,
                default_payment_days: Number(paymentDays) || 30,
              })
            }}
            disabled={loading || !name}
          >
            {loading ? 'Saving...' : 'Save Party'}
          </button>
        </div>
      </div>
    </div>
  )
}

function OrderFormModal({ lots, parties, onClose, onSave, loading, error }: {
  lots: BusinessLot[]
  parties: BusinessParty[]
  onClose: () => void
  onSave: (p: CreateOrderPayload) => void
  loading: boolean
  error: string | null
}) {
  const [lotId, setLotId] = useState('')
  const [partyId, setPartyId] = useState('')
  const [colours, setColours] = useState('1')
  const [topQty, setTopQty] = useState('')
  const [bottomQty, setBottomQty] = useState('')
  const [dupattaQty, setDupattaQty] = useState('')
  const [topRate, setTopRate] = useState('')
  const [bottomRate, setBottomRate] = useState('')
  const [dupattaRate, setDupattaRate] = useState('')
  const [discount, setDiscount] = useState('0')
  const [gst, setGst] = useState(true)
  const [paymentDays, setPaymentDays] = useState('45')

  // Auto-fill rates from party
  const selectedParty = parties.find((p) => p.id === partyId)
  useEffect(() => {
    if (selectedParty) {
      if (!topRate || Number(topRate) === 0) setTopRate(String(selectedParty.top_rate || ''))
      if (!bottomRate || Number(bottomRate) === 0) setBottomRate(String(selectedParty.bottom_rate || ''))
      if (!dupattaRate || Number(dupattaRate) === 0) setDupattaRate(String(selectedParty.dupatta_rate || ''))
      setDiscount(String(selectedParty.discount_percent || '0'))
      setPaymentDays(String(selectedParty.default_payment_days || '45'))
    }
  }, [selectedParty])

  // Calculate preview
  const totalMetres = (Number(topQty) + Number(bottomQty) + Number(dupattaQty)) * Number(colours)
  const totalAmount = (Number(topQty) * Number(topRate) + Number(bottomQty) * Number(bottomRate) + Number(dupattaQty) * Number(dupattaRate)) * Number(colours)
  const discountAmount = totalAmount * Number(discount) / 100
  const afterDiscount = totalAmount - discountAmount
  const gstAmount = gst ? afterDiscount * 0.05 : 0
  const netAmount = afterDiscount + gstAmount

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Log Order</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Lot *</label>
              <select value={lotId} onChange={(e) => setLotId(e.target.value)}>
                <option value="">Select lot...</option>
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>{l.item_name} ({l.d_no})</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Party *</label>
              <select value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                <option value="">Select party...</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Colours</label>
            <input type="number" min="1" value={colours} onChange={(e) => setColours(e.target.value)} />
          </div>
          <div className={styles.formSection}>
            <label>Quantities (per colour in metres)</label>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Top</label>
                <input type="number" value={topQty} onChange={(e) => setTopQty(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Bottom</label>
                <input type="number" value={bottomQty} onChange={(e) => setBottomQty(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Dupatta</label>
                <input type="number" value={dupattaQty} onChange={(e) => setDupattaQty(e.target.value)} />
              </div>
            </div>
          </div>
          <div className={styles.formSection}>
            <label>Rates (₹/m)</label>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Top</label>
                <input type="number" value={topRate} onChange={(e) => setTopRate(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Bottom</label>
                <input type="number" value={bottomRate} onChange={(e) => setBottomRate(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Dupatta</label>
                <input type="number" value={dupattaRate} onChange={(e) => setDupattaRate(e.target.value)} />
              </div>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Discount %</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>GST</label>
              <label className={styles.checkbox}>
                <input type="checkbox" checked={gst} onChange={(e) => setGst(e.target.checked)} />
                5% GST
              </label>
            </div>
            <div className={styles.formGroup}>
              <label>Payment Days</label>
              <input type="number" value={paymentDays} onChange={(e) => setPaymentDays(e.target.value)} />
            </div>
          </div>

          {/* Order Preview */}
          <div className={styles.orderPreview}>
            <h4>Order Preview</h4>
            <div className={styles.previewRow}>
              <span>Total Metres:</span>
              <span>{totalMetres.toLocaleString()}m</span>
            </div>
            <div className={styles.previewRow}>
              <span>Total Amount:</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className={styles.previewRow}>
              <span>Discount:</span>
              <span>-₹{discountAmount.toLocaleString()}</span>
            </div>
            <div className={styles.previewRow}>
              <span>After Discount:</span>
              <span>₹{afterDiscount.toLocaleString()}</span>
            </div>
            {gst && (
              <div className={styles.previewRow}>
                <span>GST (5%):</span>
                <span>+₹{gstAmount.toLocaleString()}</span>
              </div>
            )}
            <div className={`${styles.previewRow} ${styles.previewTotal}`}>
              <span>Net Amount:</span>
              <span>₹{netAmount.toLocaleString()}</span>
            </div>
          </div>
          {error && <div className={styles.formError}>{error}</div>}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            onClick={() => {
              if (!lotId || !partyId) return
              onSave({
                lot_id: lotId,
                party_id: partyId,
                colours: Number(colours) || 1,
                top_quantity: Number(topQty) || 0,
                bottom_quantity: Number(bottomQty) || 0,
                dupatta_quantity: Number(dupattaQty) || 0,
                top_rate: Number(topRate) || 0,
                bottom_rate: Number(bottomRate) || 0,
                dupatta_rate: Number(dupattaRate) || 0,
                discount_percent: Number(discount) || 0,
                gst,
                payment_days: Number(paymentDays) || 45,
              })
            }}
            disabled={loading || !lotId || !partyId}
          >
            {loading ? 'Saving...' : 'Log Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
