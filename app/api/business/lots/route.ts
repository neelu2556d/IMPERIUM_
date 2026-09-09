/**
 * Business Lots API — /api/business/lots
 * Access: writer.nishant2809@gmail.com only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isBusinessOwner, forbiddenResponse, unauthorizedResponse } from '@/lib/business/auth'

// GET /api/business/lots — List all lots for the authenticated user
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
    .from('business_lots')
    .select('*')
    .eq('user_id', user.id)
    .order('date_arrived', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ lots: data })
}

// POST /api/business/lots — Create a new lot
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
    item_name,
    d_no,
    design_photo_url,
    date_arrived,
    top_metres,
    bottom_metres,
    dupatta_metres,
    cost_price_top,
    cost_price_bottom,
    cost_price_dupatta,
  } = body

  if (!item_name || !d_no) {
    return NextResponse.json({ error: 'item_name and d_no are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('business_lots')
    .insert({
      user_id: user.id,
      item_name,
      d_no,
      design_photo_url,
      date_arrived: date_arrived || new Date().toISOString().split('T')[0],
      top_metres: top_metres || 0,
      bottom_metres: bottom_metres || 0,
      dupatta_metres: dupatta_metres || 0,
      cost_price_top: cost_price_top || 0,
      cost_price_bottom: cost_price_bottom || 0,
      cost_price_dupatta: cost_price_dupatta || 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ lot: data }, { status: 201 })
}