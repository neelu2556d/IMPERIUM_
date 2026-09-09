/** Business Sales API — /api/business/sales */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isBusinessOwner, forbiddenResponse, unauthorizedResponse } from '@/lib/business/auth'

// GET /api/business/sales — List all sales orders
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
    .select('*')
    .eq('user_id', user.id)
    .order('order_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ orders: data })
}

// POST /api/business/sales — Create a new sales order
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

  const { data, error } = await supabase
    .from('business_orders')
    .insert({
      user_id: user.id,
      lot_id,
      party_id,
      order_date: order_date || new Date().toISOString().split('T')[0],
      colours,
      top_quantity,
      bottom_quantity,
      dupatta_quantity,
      top_rate: top_rate || 0,
      bottom_rate: bottom_rate || 0,
      dupatta_rate: dupatta_rate || 0,
      discount_percent: discount_percent || 0,
      gst: gst || false,
      payment_days: payment_days || 30,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ order: data })
}