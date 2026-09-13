import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type {
  BusinessState,
  BusinessLot,
  BusinessParty,
  BusinessOrder,
  BusinessPayment,
  BusinessRate,
  CreateLotPayload,
  CreatePartyPayload,
  CreateOrderPayload,
  CreatePaymentPayload,
  UpdateLotPayload,
  UpdatePartyPayload,
  UpdateOrderPayload,
  UpdatePaymentPayload,
  BusinessTab,
  LotStatus,
  OrderStatus,
} from './types';

const STORAGE_KEY = 'imperium_business_v1';

// Recompute a lot's status from its remaining metres vs threshold.
function recalculateStatus(lot: BusinessLot): LotStatus {
  const min = Math.min(lot.top_remaining, lot.bottom_remaining, lot.dupatta_remaining);
  if (min <= 0) return 'cleared';
  if (min <= lot.opening_top * 0.1 || min <= lot.opening_bottom * 0.1 || min <= lot.opening_dupatta * 0.1) return 'dead_stock';
  if (min <= (lot.low_stock_threshold || 0.1)) return 'low_stock';
  if (lot.top_remaining < lot.opening_top || lot.bottom_remaining < lot.opening_bottom || lot.dupatta_remaining < lot.opening_dupatta) return 'active';
  return 'arrived';
}

export const useBusinessStore = create<BusinessState>()((set, get) => ({
  lots: [],
  lotComponents: {},
  parties: [],
  orders: [],
  orderItems: {},
  payments: [],
  rates: [],
  conversations: [],
  morningBriefings: [],

  // Loading flags
  lotsLoading: false,
  lotsError: null,
  partiesLoading: false,
  partiesError: null,
  ordersLoading: false,
  ordersError: null,
  paymentsLoading: false,
  paymentsError: null,
  ratesLoading: false,
  ratesError: null,
  conversationsLoading: false,
  conversationsError: null,
  briefingsLoading: false,
  briefingsError: null,

  // UI
  activeTab: 'lots',
  setActiveTab: (tab) => set({ activeTab: tab }),

  isLotModalOpen: false,
  editingLot: null,
  setLotModalOpen: (open) => set({ isLotModalOpen: open }),
  setEditingLot: (lot) => set({ editingLot: lot }),

  isPartyModalOpen: false,
  editingParty: null,
  setPartyModalOpen: (open) => set({ isPartyModalOpen: open }),
  setEditingParty: (party) => set({ editingParty: party }),

  isOrderModalOpen: false,
  orderWizardStep: null,
  pendingOrderData: null,
  setOrderModalOpen: (open) => set({ isOrderModalOpen: open }),
  setOrderWizardStep: (step) => set({ orderWizardStep: step }),
  setPendingOrderData: (data) => set({ pendingOrderData: data }),

  isPaymentModalOpen: false,
  editingPayment: null,
  setPaymentModalOpen: (open) => set({ isPaymentModalOpen: open }),
  setEditingPayment: (payment) => set({ editingPayment: payment }),

  // Filters
  lotStatusFilter: 'all',
  setLotStatusFilter: (filter) => set({ lotStatusFilter: filter }),
  orderStatusFilter: 'all',
  setOrderStatusFilter: (filter) => set({ orderStatusFilter: filter }),
  paymentStatusFilter: 'all',
  setPaymentStatusFilter: (filter) => set({ paymentStatusFilter: filter }),

  // Search
  lotSearchQuery: '',
  setLotSearchQuery: (query) => set({ lotSearchQuery: query }),
  partySearchQuery: '',
  setPartySearchQuery: (query) => set({ partySearchQuery: query }),
  orderSearchQuery: '',
  setOrderSearchQuery: (query) => set({ orderSearchQuery: query }),

  // Date filters
  dateRange: {},
  setDateRange: (range) => set({ dateRange: range }),

  // ── Lots ──────────────────────────────────────────────────
  fetchLots: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    set({ lotsLoading: true, lotsError: null });
    const { data, error } = await supabase
      .from('business_lots')
      .select('*')
      .eq('user_id', user.id)
      .order('date_arrived', { ascending: false });
    if (error) {
      set({ lotsLoading: false, lotsError: error.message });
    } else {
      const lotsWithStatus = (data || []).map((lot) => ({ ...lot, status: recalculateStatus(lot) }));
      set({ lots: lotsWithStatus, lotsLoading: false });
    }
  },

  fetchLotComponents: async (lotId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('business_lot_components')
      .select('*')
      .eq('lot_id', lotId);
    if (!error && data) {
      set((s) => ({ lotComponents: { ...s.lotComponents, [lotId]: data } }));
    }
  },

  createLot: async (payload: CreateLotPayload) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('business_lots')
      .insert({ user_id: user.id, ...payload, opening_top: payload.top_metres, opening_bottom: payload.bottom_metres, opening_dupatta: payload.dupatta_metres })
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ lots: [data, ...s.lots] }));
    }
  },

  updateLot: async (id: string, payload: UpdateLotPayload) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('business_lots')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ lots: s.lots.map((l) => (l.id === id ? { ...l, ...data } : l)) }));
    }
  },

  deleteLot: async (id: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('business_lots').delete().eq('id', id).eq('user_id', user.id);
    set((s) => ({ lots: s.lots.filter((l) => l.id !== id) }));
  },

  // ── Parties ────────────────────────────────────────────────
  fetchParties: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    set({ partiesLoading: true, partiesError: null });
    const { data, error } = await supabase
      .from('business_parties')
      .select('*')
      .eq('user_id', user.id)
      .order('party_name');
    if (error) {
      set({ partiesLoading: false, partiesError: error.message });
    } else {
      set({ parties: data || [], partiesLoading: false });
    }
  },

  createParty: async (payload: CreatePartyPayload) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('business_parties')
      .insert({ user_id: user.id, ...payload })
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ parties: [...s.parties, data] }));
    }
  },

  updateParty: async (id: string, payload: UpdatePartyPayload) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('business_parties')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ parties: s.parties.map((p) => (p.id === id ? data : p)) }));
    }
  },

  deleteParty: async (id: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('business_parties').delete().eq('id', id).eq('user_id', user.id);
    set((s) => ({ parties: s.parties.filter((p) => p.id !== id) }));
  },

  // ── Orders ─────────────────────────────────────────────────
  fetchOrders: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    set({ ordersLoading: true, ordersError: null });
    const { data, error } = await supabase
      .from('business_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('order_date', { ascending: false });
    if (error) {
      set({ ordersLoading: false, ordersError: error.message });
    } else {
      set({ orders: data || [], ordersLoading: false });
    }
  },

  fetchOrderItems: async (orderId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('business_order_items')
      .select('*')
      .eq('order_id', orderId);
    if (!error && data) {
      set((s) => ({ orderItems: { ...s.orderItems, [orderId]: data } }));
    }
  },

  createOrder: async (payload: CreateOrderPayload) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const totalMetre = payload.items.reduce((sum, i) => sum + i.metre, 0);
    const totalAmount = payload.items.reduce((sum, i) => sum + i.amount, 0);
    const { data, error } = await supabase
      .from('business_orders')
      .insert({
        user_id: user.id,
        party_id: payload.party_id,
        order_date: payload.order_date,
        due_date: payload.due_date,
        total_metre: totalMetre,
        total_amount: totalAmount,
        discount_percent: payload.discount_percent ?? 0,
        gst_percent: payload.gst_percent ?? 0,
        cash_discount_percent: payload.cash_discount_percent ?? 0,
        status: 'pending',
        notes: payload.notes,
      })
      .select()
      .single();
    if (!error && data) {
      // Insert order items
      const itemsToInsert = payload.items.map((item) => ({
        order_id: data.id,
        lot_id: item.lot_id || null,
        item_name: item.item_name,
        design_no: item.design_no,
        top_metre: item.top_metre || 0,
        bottom_metre: item.bottom_metre || 0,
        dupatta_metre: item.dupatta_metre || 0,
        colour_name: item.colour_name || null,
        metre: item.metre,
        price_per_metre: item.price_per_metre,
        amount: item.amount,
      }));
      await supabase.from('business_order_items').insert(itemsToInsert);
      set((s) => ({ orders: [data, ...s.orders] }));
    }
  },

  updateOrder: async (id: string, payload: UpdateOrderPayload) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('business_orders')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ orders: s.orders.map((o) => (o.id === id ? data : o)) }));
    }
  },

  deleteOrder: async (id: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('business_order_items').delete().eq('order_id', id);
    await supabase.from('business_payments').delete().eq('order_id', id);
    await supabase.from('business_orders').delete().eq('id', id).eq('user_id', user.id);
    set((s) => ({ orders: s.orders.filter((o) => o.id !== id) }));
  },

  // ── Payments ───────────────────────────────────────────────
  fetchPayments: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    set({ paymentsLoading: true, paymentsError: null });
    const { data, error } = await supabase
      .from('business_payments')
      .select('*')
      .eq('user_id', user.id)
      .order('payment_date', { ascending: false });
    if (error) {
      set({ paymentsLoading: false, paymentsError: error.message });
    } else {
      set({ payments: data || [], paymentsLoading: false });
    }
  },

  createPayment: async (payload: CreatePaymentPayload) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('business_payments')
      .insert({ user_id: user.id, ...payload })
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ payments: [data, ...s.payments] }));
      // Recalculate order status
      const order = get().orders.find((o) => o.id === payload.order_id);
      if (order) {
        const newReceived = (order.amount_received || 0) + payload.amount;
        const newStatus: OrderStatus = newReceived >= order.total_amount ? 'paid' : 'partially_paid';
        await supabase.from('business_orders').update({ amount_received: newReceived, status: newStatus }).eq('id', payload.order_id);
        set((st) => ({
          orders: st.orders.map((o) => (o.id === payload.order_id ? { ...o, amount_received: newReceived, status: newStatus } : o)),
        }));
      }
    }
  },

  updatePayment: async (id: string, payload: UpdatePaymentPayload) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('business_payments')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ payments: s.payments.map((p) => (p.id === id ? data : p)) }));
    }
  },

  deletePayment: async (id: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('business_payments').delete().eq('id', id).eq('user_id', user.id);
    set((s) => ({ payments: s.payments.filter((p) => p.id !== id) }));
  },

  // ── Rates ──────────────────────────────────────────────────
  fetchRates: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    set({ ratesLoading: true, ratesError: null });
    const { data, error } = await supabase
      .from('business_rates')
      .select('*')
      .eq('user_id', user.id);
    if (!error && data) {
      set({ rates: data, ratesLoading: false });
    }
  },

  createRate: async (payload: Partial<BusinessRate>) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('business_rates')
      .insert({ user_id: user.id, ...payload })
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ rates: [...s.rates, data] }));
    }
  },

  updateRate: async (id: string, payload: Partial<BusinessRate>) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('business_rates')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ rates: s.rates.map((r) => (r.id === id ? data : r)) }));
    }
  },

  deleteRate: async (id: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('business_rates').delete().eq('id', id).eq('user_id', user.id);
    set((s) => ({ rates: s.rates.filter((r) => r.id !== id) }));
  },

  // ── Conversations ──────────────────────────────────────────
  fetchConversations: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('business_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (!error && data) {
      set({ conversations: data });
    }
  },

  sendConversation: async (content: string, mode: string = 'chat') => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('business_conversations')
      .insert({ user_id: user.id, role: 'user', content, mode })
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ conversations: [...s.conversations, data] }));
    }
  },

  // ── Morning briefings ──────────────────────────────────────
  fetchBriefings: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('business_morning_briefings')
      .select('*')
      .eq('user_id', user.id)
      .eq('briefing_date', today)
      .single();
    if (!error && data) {
      set({ morningBriefings: [data] });
    }
  },

  generateMorningBriefing: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('business_morning_briefings')
      .upsert({ user_id: user.id, briefing_date: today, content: { status: 'generated' } })
      .select()
      .single();
    if (!error && data) {
      set({ morningBriefings: [data] });
    }
  },
}));