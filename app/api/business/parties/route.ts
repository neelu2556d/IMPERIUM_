/**
 * Business Parties API — /api/business/parties
 * Access: writer.nishant2809@gmail.com only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isBusinessOwner, forbiddenResponse, unauthorizedResponse } from '@/lib/business/auth'

// GET /api/business/parties — List all parties
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
    .from('business_parties')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

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
    return unauthorizedResponse()
  }

  if (!isBusinessOwner(user.email)) {
    return forbiddenResponse()
  }

  const body = await req.json()
  const { name, email, top_rate, bottom_rate, dupatta_rate, discount_percent, default_payment_days, gst_preference } = body

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('business_parties')
    .insert({
      user_id: user.id,
      name,
      email,
      top_rate: top_rate || 0,
      bottom_rate: bottom_rate || 0,
      dupatta_rate: dupatta_rate || 0,
      discount_percent: discount_percent || 0,
      default_payment_days: default_payment_days || 30,
      gst_preference: gst_preference || 'standard',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ party: data }, { status: 201 })
}