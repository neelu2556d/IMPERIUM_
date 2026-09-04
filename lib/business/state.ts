/**
 * Business module — Client-side state with persistence.
 * Mirrors the finance/state.ts pattern: localStorage for offline + Supabase
 * for cross-device sync. Single-user data only (writer.nishant2809@gmail.com).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  type BusinessState,
  type BusinessLot,
  type BusinessParty,
  type BusinessOrder,
  type CollectionEntry,
  type PartyLedgerEntry,
  type CreateLotPayload,
  type CreateOrderPayload,
  type CreatePartyPayload,
  DEFAULT_BUSINESS_STATE,
} from './types'

const STORAGE_KEY = 'imperium_business_v1'

/**
 * Hook to manage all business module state.
 * - Loads from Supabase on mount (if user is authorized)
 * - Falls back to localStorage for offline / pre-auth scenarios
 * - Provides mutators that write to both
 */
export function useBusinessState() {
  const [state, setState] = useState<BusinessState>(DEFAULT_BUSINESS_STATE)
  const [ready, setReady] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  // Load on mount
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (cancelled) return

        // Public access — any logged-in user can view their business data
        if (!user) {
          setIsAuthorized(false)
          setReady(true)
          return
        }
        setIsAuthorized(true)

        // Load all in parallel
        const [lotsRes, partiesRes, ordersRes, collectionsRes] = await Promise.all([
          supabase.from('business_lots').select('*').eq('user_id', user.id).order('date_arrived', { ascending: false }),
          supabase.from('business_parties').select('*').eq('user_id', user.id).order('name'),
          supabase.from('business_orders').select('*, lot:business_lots(item_name, d_no), party:business_parties(name)').eq('user_id', user.id).order('order_date', { ascending: false }),
          supabase.from('business_collection_register').select('*, party:business_parties(name)').order('due_date'),
        ])

        if (cancelled) return

        const lots = (lotsRes.data ?? []) as BusinessLot[]
        const parties = (partiesRes.data ?? []) as BusinessParty[]
        const orders = (ordersRes.data ?? []) as BusinessOrder[]
        const collections = (collectionsRes.data ?? []) as CollectionEntry[]

        setState((s) => ({
          ...s,
          lots,
          parties,
          orders,
          collections,
          loading: { lots: false, orders: false, parties: false, collections: false },
          errors: { lots: null, orders: null, parties: null, collections: null },
        }))

        // Persist to localStorage as a backup
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, lots, parties, orders, collections }))
        } catch {}

        setReady(true)
      } catch (err) {
        if (cancelled) return
        // On error, load from localStorage
        try {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed.version === 1) {
              setState((s) => ({
                ...s,
                lots: parsed.lots ?? [],
                parties: parsed.parties ?? [],
                orders: parsed.orders ?? [],
                collections: parsed.collections ?? [],
              }))
            }
          }
        } catch {}
        setReady(true)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [supabase])

  // -------------------------------------------------------------------------
  // Mutators
  // -------------------------------------------------------------------------

  const createLot = useCallback(async (payload: CreateLotPayload) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isBusinessOwner(user.email)) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('business_lots')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single()

    if (error) throw error

    setState((s) => ({
      ...s,
      lots: [data as BusinessLot, ...s.lots],
    }))

    return data as BusinessLot
  }, [supabase])

  const updateLot = useCallback(async (id: string, payload: Partial<BusinessLot>) => {
    const { data, error } = await supabase
      .from('business_lots')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    setState((s) => ({
      ...s,
      lots: s.lots.map((l) => (l.id === id ? { ...l, ...payload } : l)),
    }))

    return data as BusinessLot
  }, [supabase])

  const deleteLot = useCallback(async (id: string) => {
    const { error } = await supabase.from('business_lots').delete().eq('id', id)
    if (error) throw error

    setState((s) => ({
      ...s,
      lots: s.lots.filter((l) => l.id !== id),
    }))
  }, [supabase])

  const createParty = useCallback(async (payload: CreatePartyPayload) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isBusinessOwner(user.email)) {
      throw new Error('Unauthorized')
    }

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

    return data as BusinessParty
  }, [supabase])

  const createOrder = useCallback(async (payload: CreateOrderPayload) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isBusinessOwner(user.email)) {
      throw new Error('Unauthorized')
    }

    // Calculate totals
    const totalMetres = (payload.top_quantity + payload.bottom_quantity + payload.dupatta_quantity) * payload.colours
    const totalAmount =
      (payload.top_quantity * payload.top_rate +
        payload.bottom_quantity * payload.bottom_rate +
        payload.dupatta_quantity * payload.dupatta_rate) * payload.colours
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
        order_date: orderDate.toISOString(),
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

    // Auto-populate party ledger
    await supabase.from('business_party_ledger').insert({
      party_id: payload.party_id,
      outstanding_amount: netAmount,
      due_date: dueDate.toISOString(),
      status: 'pending',
      last_transaction_date: orderDate.toISOString(),
    })

    // Update lot stock
    const deductedTop = payload.top_quantity * payload.colours
    const deductedBottom = payload.bottom_quantity * payload.colours
    const deductedDupatta = payload.dupatta_quantity * payload.colours

    // Insert stock deduction records
    for (let colour = 1; colour <= payload.colours; colour++) {
      await supabase.from('business_stock_register').insert({
        order_id: data.id,
        lot_id: payload.lot_id,
        colour,
        quantity_deducted: payload.top_quantity + payload.bottom_quantity + payload.dupatta_quantity,
        remaining_after: 0,
      })
    }

    // Update lot status and remaining stock
    const { data: lot } = await supabase
      .from('business_lots')
      .select('top_metres, bottom_metres, dupatta_metres')
      .eq('id', payload.lot_id)
      .single()

    if (lot) {
      const newRemainingTop = Math.max(0, Number(lot.top_metres) - deductedTop)
      const newRemainingBottom = Math.max(0, Number(lot.bottom_metres) - deductedBottom)
      const newRemainingDupatta = Math.max(0, Number(lot.dupatta_metres) - deductedDupatta)

      let newStatus = 'active'
      if (newRemainingTop === 0 && newRemainingBottom === 0 && newRemainingDupatta === 0) {
        newStatus = 'cleared'
      } else if (newRemainingTop < 100 || newRemainingBottom < 100 || newRemainingDupatta < 100) {
        newStatus = 'low_stock'
      }

      await supabase.from('business_lots').update({ status: newStatus }).eq('id', payload.lot_id)
    }

    setState((s) => ({
      ...s,
      orders: [data as BusinessOrder, ...s.orders],
    }))

    return data as BusinessOrder
  }, [supabase])

  // -------------------------------------------------------------------------
  // UI actions
  // -------------------------------------------------------------------------

  const setActiveTab = useCallback((tab: BusinessState['activeTab']) => {
    setState((s) => ({ ...s, activeTab: tab }))
  }, [])

  const setSelectedLotId = useCallback((id: string | null) => {
    setState((s) => ({ ...s, selectedLotId: id }))
  }, [])

  const setSelectedOrderId = useCallback((id: string | null) => {
    setState((s) => ({ ...s, selectedOrderId: id }))
  }, [])

  const setReportPeriod = useCallback((period: BusinessState['reportPeriod']) => {
    setState((s) => ({ ...s, reportPeriod: period }))
  }, [])

  return {
    state,
    ready,
    isAuthorized,
    // Mutators
    createLot,
    updateLot,
    deleteLot,
    createParty,
    createOrder,
    // UI
    setActiveTab,
    setSelectedLotId,
    setSelectedOrderId,
    setReportPeriod,
  }
}
