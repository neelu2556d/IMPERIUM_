import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/business/parties — List all parties for the authenticated user
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data, error } = await supabase
    .from('business_parties')
    .select('*')
    .eq('user_id', user.id)
    .order('party_name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ parties: data })
}

// POST /api/business/parties — Create a new party
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const {
    party_name,
    city,
    contact_person,
    phone,
    email,
    address,
    default_payment_terms,
    default_gst,
    default_cash_discount,
    is_active,
  } = body

  if (!party_name) {
    return NextResponse.json({ error: 'party_name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('business_parties')
    .insert({
      user_id: user.id,
      party_name,
      city,
      contact_person,
      phone,
      email,
      address,
      default_payment_terms,
      default_gst,
      default_cash_discount,
      is_active,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ party: data })
}

// PATCH /api/business/parties/:id — Update a party
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const {
    party_name,
    city,
    contact_person,
    phone,
    email,
    address,
    default_payment_terms,
    default_gst,
    default_cash_discount,
    is_active,
  } = body

  const updates: any = {}
  if (party_name !== undefined) updates.party_name = party_name
  if (city !== undefined) updates.city = city
  if (contact_person !== undefined) updates.contact_person = contact_person
  if (phone !== undefined) updates.phone = phone
  if (email !== undefined) updates.email = email
  if (address !== undefined) updates.address = address
  if (default_payment_terms !== undefined) updates.default_payment_terms = default_payment_terms
  if (default_gst !== undefined) updates.default_gst = default_gst
  if (default_cash_discount !== undefined) updates.default_cash_discount = default_cash_discount
  if (is_active !== undefined) updates.is_active = is_active

  const { data, error } = await supabase
    .from('business_parties')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ party: data })
}

// DELETE /api/business/parties/:id — Delete a party
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { error } = await supabase
    .from('business_parties')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}