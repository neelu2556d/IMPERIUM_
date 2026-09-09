/** Business Collection Register API — /api/business/collection_register */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isBusinessOwner, forbiddenResponse, unauthorizedResponse } from '@/lib/business/auth'

// GET /api/business/collection_register — List all collection registers for the user
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
    .from('business_collection_register')
    .select('*')
    .eq('user_id', user.id)
    .order('invoice_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ collection_register: data })
}

// POST /api/business/collection_register — Create or update a collection register entry
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
  const { party_id, invoice_date, due_date, amount, status } = body

  if (!party_id || !amount) {
    return NextResponse.json({ error: 'party_id and amount are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('business_collection_register')
    .upsert({
      party_id,
      invoice_date: invoice_date || new Date().toISOString().split('T')[0],
      due_date: due_date || new Date().toISOString().split('T')[0],
      amount,
      status: status || 'pending',
      payment_date: null,
    })
    .eq('user_id', user.id)
    .eq('party_id', party_id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ collection_register: data })
}
