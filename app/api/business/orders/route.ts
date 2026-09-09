/**
 * Business Orders API — /api/business/orders
 * Access: writer.nishant2809@gmail.com only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isBusinessOwner, forbiddenResponse, unauthorizedResponse } from '@/lib/business/auth'

// GET /api/business/orders — List all orders
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorizedResponse()
  }

  if (!isBusinessOwner(user.email)) {
    return forbiddenResponse()
  }

  const { data, error } = await supabase
    .from('business_orders')
    .select('*, lot:business_lots(item_name, d_no), party:business_parties(name)')
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
    return unauthorizedResponse()
  }

  if (!isBusinessOwner(user.email)) {
    return forbiddenResponse()
  }

  const body = await req.json()
  const {
    lot_id,
    party_id,
    order_date,
    colours,
    top_quantity,
    bottom_quantity,
    dupatta_quantity,
    top_rate,
    bottom_rate,
    dupatta_rate,
    discount_percent,
    gst,
    payment_days,
  } = body

  if (!lot_id || !party_id) {
    return NextResponse.json({ error: 'lot_id and party_id are required' }, { status: 400 })
  }

  const orderDate = order_date || new Date().toISOString().split('T')[0]
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + (payment_days || 45))

  const totalMetres = (Number(top_quantity) + Number(bottom_quantity) + Number(dupatta_quantity)) * Number(colours || 1)
  const totalAmount = (Number(top_quantity) * Number(top_rate || 0) + Number(bottom_quantity) * Number(bottom_rate || 0) + Number(dupatta_quantity) * Number(dupatta_rate || 0)) * Number(colours || 1)
  const discountAmount = totalAmount * Number(discount_percent || 0) / 100
  const afterDiscount = totalAmount - discountAmount
  const gstAmount = gst ? afterDiscount * 0.05 : 0
  const netAmount = afterDiscount + gstAmount

  const { data, error } = await supabase
    .from('business_orders')
    .insert({
      user_id: user.id,
      lot_id,
      party_id,
      order_date: orderDate,
      colours: Number(colours) || 1,
      top_quantity: Number(top_quantity) || 0,
      bottom_quantity: Number(bottom_quantity) || 0,
      dupatta_quantity: Number(dupatta_quantity) || 0,
      top_rate: Number(top_rate) || 0,
      bottom_rate: Number(bottom_rate) || 0,
      dupatta_rate: Number(dupatta_rate) || 0,
      discount_percent: Number(discount_percent) || 0,
      gst: gst !== undefined ? gst : true,
      payment_days: Number(payment_days) || 45,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pending',
    })
    .select('*, lot:business_lots(item_name, d_no), party:business_parties(name)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-populate sales register
  await supabase.from('business_sales_register').insert({
    order_id: data.id,
    amount: totalAmount,
    gst_rate: gst ? 5 : 0,
    net_amount: netAmount,
  })

  // Auto-populate collection register
  await supabase.from('business_collection_register').insert({
    party_id,
    invoice_date: orderDate,
    due_date: dueDate.toISOString().split('T')[0],
    amount: netAmount,
    status: 'pending',
  })

  // Auto-populate party ledger
  await supabase.from('business_party_ledger').insert({
    party_id,
    outstanding_amount: netAmount,
    due_date: dueDate.toISOString().split('T')[0],
    status: 'pending',
    last_transaction_date: orderDate,
  })

  return NextResponse.json({ order: data }, { status: 201 })
}