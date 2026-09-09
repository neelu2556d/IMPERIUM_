/** Business Stock API — /api/business/stock */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isBusinessOwner, forbiddenResponse, unauthorizedResponse } from '@/lib/business/auth'

// GET /api/business/stock — List all stock entries for the authenticated user
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
    .from('business_stock_register')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ stock: data })
}

// POST /api/business/stock — Create or update a stock entry
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
  const { lot_id, colour, top_metres, bottom_metres, dupatta_metres } = body

  if (!lot_id || !colour) {
    return NextResponse.json({ error: 'lot_id and colour are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('business_stock_register')
    .upsert({
      lot_id,
      colour,
      top_metres: top_metres ?? 0,
      bottom_metres: bottom_metres ?? 0,
      dupatta_metres: dupatta_metres ?? 0,
    })
    .eq('user_id', user.id)
    .eq('colour', colour)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ stock: data })
}