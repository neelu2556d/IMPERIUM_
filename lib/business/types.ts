/**
 * Business module types — garment business management.
 * Single-user data only (writer.nishant2809@gmail.com).
 */

export type LotStatus = 'arrived' | 'active' | 'low_stock' | 'cleared' | 'dead_stock'
export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'partially_paid'
export type CollectionStatus = 'pending' | 'paid' | 'partial'
export type ReportPeriod = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly'
export type BusinessTab =
  | 'lots'
  | 'orders'
  | 'stock'
  | 'sales'
  | 'party'
  | 'collection'
  | 'reports'
  | 'imperium'

export interface BusinessLot {
  id: string
  user_id: string
  item_name: string
  d_no: string
  design_photo_url?: string | null
  date_arrived: string
  status: LotStatus
  top_metres: number
  bottom_metres: number
  dupatta_metres: number
  cost_price_top: number
  cost_price_bottom: number
  cost_price_dupatta: number
  total_metres: number
  remaining_top: number
  remaining_bottom: number
  remaining_dupatta: number
  remaining_total: number
  created_at: string
  updated_at: string
}

export interface BusinessParty {
  id: string
  user_id: string
  name: string
  email?: string | null
  top_rate: number
  bottom_rate: number
  dupatta_rate: number
  discount_percent: number
  default_payment_days: number
  gst_preference: 'standard' | 'exempt'
  rate_card?: Record<string, number> | null
  created_at: string
}

export interface BusinessOrder {
  id: string
  user_id: string
  lot_id: string
  party_id: string
  order_date: string
  colours: number
  top_quantity: number
  bottom_quantity: number
  dupatta_quantity: number
  top_rate: number
  bottom_rate: number
  dupatta_rate: number
  discount_percent: number
  gst: boolean
  payment_days: number
  total_metres: number
  total_amount: number
  discount_amount: number
  after_discount: number
  gst_amount: number
  net_amount: number
  due_date: string
  status: OrderStatus
  lot?: { item_name: string; d_no: string } | null
  party?: { name: string } | null
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  colour: number
  quantity: number
  rate: number
  gst: boolean
  discount_percent: number
  amount: number
}

export interface CollectionEntry {
  id: string
  party_id: string
  invoice_date: string
  due_date: string
  amount: number
  status: CollectionStatus
  party?: { name: string } | null
}

export interface PartyLedgerEntry {
  id: string
  party_id: string
  outstanding_amount: number
  due_date: string
  status: string
  last_transaction_date: string
  party?: { name: string } | null
}

export interface CreateLotPayload {
  item_name: string
  d_no: string
  design_photo_url?: string | null
  date_arrived: string
  top_metres: number
  bottom_metres: number
  dupatta_metres: number
  cost_price_top?: number
  cost_price_bottom?: number
  cost_price_dupatta?: number
}

export interface CreatePartyPayload {
  name: string
  email?: string
  top_rate: number
  bottom_rate: number
  dupatta_rate: number
  discount_percent?: number
  default_payment_days?: number
  gst_preference?: 'standard' | 'exempt'
}

export interface CreateOrderPayload {
  lot_id: string
  party_id: string
  colours: number
  top_quantity: number
  bottom_quantity: number
  dupatta_quantity: number
  top_rate: number
  bottom_rate: number
  dupatta_rate: number
  discount_percent?: number
  gst?: boolean
  payment_days?: number
  order_items?: OrderItem[]
}

export interface BusinessState {
  lots: BusinessLot[]
  parties: BusinessParty[]
  orders: BusinessOrder[]
  collections: CollectionEntry[]
  loading: {
    lots: boolean
    orders: boolean
    parties: boolean
    collections: boolean
  }
  errors: {
    lots: string | null
    orders: string | null
    parties: string | null
    collections: string | null
  }
  activeTab: BusinessTab
  selectedLotId: string | null
  selectedOrderId: string | null
  reportPeriod: ReportPeriod
}

export const DEFAULT_BUSINESS_STATE: BusinessState = {
  lots: [],
  parties: [],
  orders: [],
  collections: [],
  loading: { lots: false, orders: false, parties: false, collections: false },
  errors: { lots: null, orders: null, parties: null, collections: null },
  activeTab: 'lots',
  selectedLotId: null,
  selectedOrderId: null,
  reportPeriod: 'monthly',
}