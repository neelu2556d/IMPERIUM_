import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/business/payments — List all payments for the authenticated user
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data, error } = await supabase
    .from('business_payments')
    .select('*')
    .eq('user_id', user.id)
    .order('payment_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ payments: data })
}

// POST /api/business/payments — Create a new payment
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const {
    order_id,
    payment_date,
    amount,
    payment_method,
    reference_number,
    notes,
  } = body

  if (!order_id || !amount || !payment_method) {
    return NextResponse.json({ error: 'order_id, amount, and payment_method are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('business_payments')
    .insert({
      user_id: user.id,
      order_id,
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      amount,
      payment_method,
      reference_number,
      notes,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update amount_received on the order
  const { data: order } = await supabase
    .from('business_orders')
    .select('amount_received, total_amount')
    .eq('id', order_id)
    .eq('user_id', user.id)
    .single()

  if (order) {
    const newAmountReceived = (order.amount_received || 0) + amount
    const newStatus = newAmountReceived >= order.total_amount ? 'paid' : 'partially_paid'
    await supabase
      .from('business_orders')
      .update({ amount_received: newAmountReceived, status: newStatus })
      .eq('id', order_id)
      .eq('user_id', user.id)
  }

  return NextResponse.json({ payment: data }, { status: 201 })
}

// PATCH /api/business/payments/:id — Update a payment
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const {
    payment_date,
    amount,
    payment_method,
    reference_number,
    notes,
  } = body

  const updates: any = {}
  if (payment_date !== undefined) updates.payment_date = payment_date
  if (amount !== undefined) updates.amount = amount
  if (payment_method !== undefined) updates.payment_method = payment_method
  if (reference_number !== undefined) updates.reference_number = reference_number
  if (notes !== undefined) updates.notes = notes

  const { data, error } = await supabase
    .from('business_payments')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ payment: data })
}

// DELETE /api/business/payments/:id — Delete a payment
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Fetch the payment to revert amount_received on the order
  const { data: payment } = await supabase
    .from('business_payments')
    .select('order_id, amount')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (payment && payment.order_id) {
    const { data: order } = await supabase
      .from('business_orders')
      .select('amount_received, total_amount')
      .eq('id', payment.order_id)
      .eq('user_id', user.id)
      .single()
    if (order) {
      const newAmountReceived = Math.max(0, (order.amount_received || 0) - payment.amount)
      const newStatus = newAmountReceived >= order.total_amount ? 'paid' : 'partially_paid'
      await supabase
        .from('business_orders')
        .update({ amount_received: newAmountReceived, status: newStatus })
        .eq('id', payment.order_id)
        .eq('user_id', user.id)
    }
  }

  const { error } = await supabase
    .from('business_payments')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}