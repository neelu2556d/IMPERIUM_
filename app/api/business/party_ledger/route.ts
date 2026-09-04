/** Business Party Ledger API — /api/business/party_ledger */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isBusinessOwner, forbiddenResponse, unauthorizedResponse } from '@/lib/business/auth'

// GET /api/business/party_ledger — List all party ledger entries for the user
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
    .from('business_party_ledger')
    .select('*')
    .eq('user_id', user.id)
    .order('last_transaction_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ledger: data })
}

// POST /api/business/party_ledger — Add or update a ledger entry
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
  const { party_id, outstanding_amount, due_date, status } = body

  if (!party_id || !outstanding_amount) {
    return NextResponse.json({ error: 'party_id and outstanding_amount are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('business_party_ledger')
    .upsert({
      party_id,
      outstanding_amount,
      due_date: due_date || new Date().toISOString().split('T')[0],
      status: status || 'pending',
      last_transaction_date: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('party_id', party_id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ledger: data })
}
