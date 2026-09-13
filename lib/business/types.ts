// Business module types — garment business management.

export type LotStatus = 'arrived' | 'active' | 'low_stock' | 'cleared' | 'dead_stock';
export type OrderStatus = 'pending' | 'partially_paid' | 'paid' | 'cancelled';
export type CollectionStatus = 'pending' | 'paid' | 'partial';
export type ReportPeriod = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
export type BusinessTab =
  | 'lots'
  | 'parties'
  | 'orders'
  | 'payments'
  | 'reports'
  | 'ai'
  | 'profiles'
  | 'connections'
  | 'settings';

export interface BusinessLot {
  id: string;
  user_id: string;
  item_name: string;
  design_no: string;
  design_photo_url?: string;
  date_arrived: string;
  top_metres: number;
  bottom_metres: number;
  dupatta_metres: number;
  top_colour_count: number;
  bottom_colour_count: number;
  dupatta_colour_count: number;
  top_remaining: number;
  bottom_remaining: number;
  dupatta_remaining: number;
  opening_top: number;
  opening_bottom: number;
  opening_dupatta: number;
  low_stock_threshold: number;
  status: LotStatus;
  notes?: string;
  created_at: string;
}

export interface BusinessLotComponent {
  id: string;
  lot_id: string;
  component_type: 'top' | 'bottom' | 'dupatta';
  colour_name: string;
  colour_metre: number;
  colour_price: number;
}

export interface BusinessParty {
  id: string;
  user_id: string;
  party_name: string;
  city?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  default_payment_terms: number;
  default_gst: string;
  default_cash_discount: number;
  is_active: boolean;
  created_at: string;
}

export interface BusinessOrder {
  id: string;
  user_id: string;
  party_id: string;
  order_date: string;
  due_date: string;
  total_metre: number;
  total_amount: number;
  discount_percent: number;
  gst_percent: number;
  cash_discount_percent: number;
  amount_received: number;
  status: OrderStatus;
  invoice_number?: string;
  notes?: string;
  created_at: string;
}

export interface BusinessOrderItem {
  id: string;
  order_id: string;
  lot_id?: string;
  item_name: string;
  design_no: string;
  top_metre: number;
  bottom_metre: number;
  dupatta_metre: number;
  colour_name?: string;
  metre: number;
  price_per_metre: number;
  amount: number;
}

export interface BusinessPayment {
  id: string;
  order_id: string;
  user_id: string;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'online';
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface BusinessRate {
  id: string;
  user_id: string;
  party_id: string;
  item_name: string;
  design_no: string;
  price_per_metre: number;
  is_default: boolean;
  created_at: string;
}

export interface BusinessConversation {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: 'chat' | 'morning_briefing' | 'pre_visit_brief' | 'post_day';
  created_at: string;
}

export interface BusinessMorningBriefing {
  id: string;
  user_id: string;
  briefing_date: string;
  content: any;
  created_at: string;
}

// Payload types for mutations
export interface CreateLotPayload {
  item_name: string;
  design_no: string;
  design_photo_url?: string;
  date_arrived: string;
  top_metres: number;
  bottom_metres: number;
  dupatta_metres: number;
  low_stock_threshold?: number;
  notes?: string;
}

export interface UpdateLotPayload {
  item_name?: string;
  design_no?: string;
  design_photo_url?: string;
  date_arrived?: string;
  top_metres?: number;
  bottom_metres?: number;
  dupatta_metres?: number;
  low_stock_threshold?: number;
  status?: LotStatus;
  notes?: string;
}

export interface CreatePartyPayload {
  party_name: string;
  city?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  default_payment_terms?: number;
  default_gst?: string;
  default_cash_discount?: number;
}

export interface UpdatePartyPayload {
  party_name?: string;
  city?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  default_payment_terms?: number;
  default_gst?: string;
  default_cash_discount?: number;
  is_active?: boolean;
}

export interface CreateOrderPayload {
  party_id: string;
  order_date: string;
  due_date: string;
  items: BusinessOrderItem[];
  discount_percent?: number;
  gst_percent?: number;
  cash_discount_percent?: number;
  notes?: string;
}

export interface UpdateOrderPayload {
  party_id?: string;
  order_date?: string;
  due_date?: string;
  discount_percent?: number;
  gst_percent?: number;
  cash_discount_percent?: number;
  status?: OrderStatus;
  notes?: string;
}

export interface CreatePaymentPayload {
  order_id: string;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'online';
  reference_number?: string;
  notes?: string;
}

export interface UpdatePaymentPayload {
  payment_date?: string;
  amount?: number;
  payment_method?: 'cash' | 'bank_transfer' | 'online';
  reference_number?: string;
  notes?: string;
}

export interface BusinessState {
  // Lots
  lots: BusinessLot[];
  lotsLoading: boolean;
  lotsError: string | null;

  // Lot components
  lotComponents: Record<string, BusinessLotComponent[]>;

  // Parties
  parties: BusinessParty[];
  partiesLoading: boolean;
  partiesError: string | null;

  // Orders
  orders: BusinessOrder[];
  ordersLoading: boolean;
  ordersError: string | null;

  // Order items
  orderItems: Record<string, BusinessOrderItem[]>;

  // Payments
  payments: BusinessPayment[];
  paymentsLoading: boolean;
  paymentsError: string | null;

  // Rates
  rates: BusinessRate[];
  ratesLoading: boolean;
  ratesError: string | null;

  // Conversations
  conversations: BusinessConversation[];
  conversationsLoading: boolean;
  conversationsError: string | null;

  // Morning briefings
  morningBriefings: BusinessMorningBriefing[];
  briefingsLoading: boolean;
  briefingsError: string | null;

  // Actions
  fetchLots: () => Promise<void>;
  fetchLotComponents: (lotId: string) => Promise<void>;
  createLot: (data: CreateLotPayload) => Promise<void>;
  updateLot: (id: string, data: UpdateLotPayload) => Promise<void>;
  deleteLot: (id: string) => Promise<void>;

  fetchParties: () => Promise<void>;
  createParty: (data: CreatePartyPayload) => Promise<void>;
  updateParty: (id: string, data: UpdatePartyPayload) => Promise<void>;
  deleteParty: (id: string) => Promise<void>;

  fetchOrders: () => Promise<void>;
  fetchOrderItems: (orderId: string) => Promise<void>;
  createOrder: (data: CreateOrderPayload) => Promise<void>;
  updateOrder: (id: string, data: UpdateOrderPayload) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;

  fetchPayments: () => Promise<void>;
  createPayment: (data: CreatePaymentPayload) => Promise<void>;
  updatePayment: (id: string, data: UpdatePaymentPayload) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  fetchRates: () => Promise<void>;
  createRate: (data: Partial<BusinessRate>) => Promise<void>;
  updateRate: (id: string, data: Partial<BusinessRate>) => Promise<void>;
  deleteRate: (id: string) => Promise<void>;

  fetchConversations: () => Promise<void>;
  sendConversation: (content: string, mode?: string) => Promise<void>;

  fetchBriefings: () => Promise<void>;
  generateMorningBriefing: () => Promise<void>;

  // UI state
  activeTab: BusinessTab;
  setActiveTab: (tab: BusinessTab) => void;

  // Modals
  isLotModalOpen: boolean;
  editingLot: BusinessLot | null;
  setLotModalOpen: (open: boolean) => void;
  setEditingLot: (lot: BusinessLot | null) => void;

  isPartyModalOpen: boolean;
  editingParty: BusinessParty | null;
  setPartyModalOpen: (open: boolean) => void;
  setEditingParty: (party: BusinessParty | null) => void;

  isOrderModalOpen: boolean;
  orderWizardStep: 'lot' | 'party' | 'review' | null;
  pendingOrderData: any;
  setOrderModalOpen: (open: boolean) => void;
  setOrderWizardStep: (step: 'lot' | 'party' | 'review' | null) => void;
  setPendingOrderData: (data: any) => void;

  isPaymentModalOpen: boolean;
  editingPayment: BusinessPayment | null;
  setPaymentModalOpen: (open: boolean) => void;
  setEditingPayment: (payment: BusinessPayment | null) => void;

  // Filters
  lotStatusFilter: string;
  setLotStatusFilter: (filter: string) => void;

  orderStatusFilter: string;
  setOrderStatusFilter: (filter: string) => void;

  paymentStatusFilter: string;
  setPaymentStatusFilter: (filter: string) => void;

  // Search
  lotSearchQuery: string;
  setLotSearchQuery: (query: string) => void;

  partySearchQuery: string;
  setPartySearchQuery: (query: string) => void;

  orderSearchQuery: string;
  setOrderSearchQuery: (query: string) => void;

  // Date filters
  dateRange: { from?: Date; to?: Date };
  setDateRange: (range: { from?: Date; to?: Date }) => void;
}