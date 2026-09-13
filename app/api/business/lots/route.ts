import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/business/lots — List all lots for the authenticated user
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
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
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const {
    item_name,
    design_no,
    design_photo_url,
    date_arrived,
    top_metres,
    bottom_metres,
    dupatta_metres,
    low_stock_threshold,
    notes,
  } = body

  if (!item_name || !design_no) {
    return NextResponse.json({ error: 'item_name and design_no are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('business_lots')
    .insert({
      user_id: user.id,
      item_name,
      design_no,
      design_photo_url,
      date_arrived: date_arrived || new Date().toISOString().split('T')[0],
      top_metres: top_metres || 0,
      bottom_metres: bottom_metres || 0,
      dupatta_metres: dupatta_metres || 0,
      top_remaining: top_metres || 0,
      bottom_remaining: bottom_metres || 0,
      dupatta_remaining: dupatta_metres || 0,
      opening_top: top_metres || 0,
      opening_bottom: bottom_metres || 0,
      opening_dupatta: dupatta_metres || 0,
      low_stock_threshold: low_stock_threshold ?? 0.1,
      notes,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ lot: data }, { status: 201 })
}

// PATCH /api/business/lots — Update a lot
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  // Clean up undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  )

  const { data, error } = await supabase
    .from('business_lots')
    .update(cleanUpdates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ lot: data })
}

// DELETE /api/business/lots — Delete a lot
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('business_lots')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}