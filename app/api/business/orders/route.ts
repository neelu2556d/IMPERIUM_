import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/business/orders — List all orders for the authenticated user
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data, error } = await supabase
    .from('business_orders')
    .select('*')
    .eq('user_id', user.id)
    .order('order_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ orders: data })
}

// POST /api/business/orders — Create a new order
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const {
    party_id,
    order_date,
    due_date,
    items,
    discount_percent,
    gst_percent,
    cash_discount_percent,
    notes,
  } = body

  if (!party_id || !due_date) {
    return NextResponse.json({ error: 'party_id and due_date are required' }, { status: 400 })
  }

  // Calculate totals from items
  const totalMetre = items?.reduce((sum: number, i: any) => sum + i.metre, 0) || 0
  const totalAmount = items?.reduce((sum: number, i: any) => sum + i.amount, 0) || 0

  const { data, error } = await supabase
    .from('business_orders')
    .insert({
      user_id: user.id,
      party_id,
      order_date: order_date || new Date().toISOString().split('T')[0],
      due_date,
      total_metre: totalMetre,
      total_amount: totalAmount,
      discount_percent,
      gst_percent,
      cash_discount_percent,
      notes,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Insert order items if provided
  if (items && items.length > 0 && data) {
    const orderItems = items.map((item: any) => ({
      order_id: data.id,
      lot_id: item.lot_id,
      item_name: item.item_name,
      design_no: item.design_no,
      top_metre: item.top_metre,
      bottom_metre: item.bottom_metre,
      dupatta_metre: item.dupatta_metre,
      colour_name: item.colour_name,
      metre: item.metre,
      price_per_metre: item.price_per_metre,
      amount: item.amount,
    }))

    const { error: itemsError } = await supabase
      .from('business_order_items')
      .insert(orderItems)

    if (itemsError) {
      // Rollback: delete the order
      await supabase.from('business_orders').delete().eq('id', data.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ order: data }, { status: 201 })
}

// PATCH /api/business/orders/:id — Update an order
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const {
    party_id,
    order_date,
    due_date,
    total_metre,
    total_amount,
    discount_percent,
    gst_percent,
    cash_discount_percent,
    amount_received,
    status,
    invoice_number,
    notes,
  } = body

  const updates: any = {}
  if (party_id !== undefined) updates.party_id = party_id
  if (order_date !== undefined) updates.order_date = order_date
  if (due_date !== undefined) updates.due_date = due_date
  if (total_metre !== undefined) updates.total_metre = total_metre
  if (total_amount !== undefined) updates.total_amount = total_amount
  if (discount_percent !== undefined) updates.discount_percent = discount_percent
  if (gst_percent !== undefined) updates.gst_percent = gst_percent
  if (cash_discount_percent !== undefined) updates.cash_discount_percent = cash_discount_percent
  if (amount_received !== undefined) updates.amount_received = amount_received
  if (status !== undefined) updates.status = status
  if (invoice_number !== undefined) updates.invoice_number = invoice_number
  if (notes !== undefined) updates.notes = notes

  const { data, error } = await supabase
    .from('business_orders')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ order: data })
}

// DELETE /api/business/orders/:id — Delete an order
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { error } = await supabase
    .from('business_orders')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}