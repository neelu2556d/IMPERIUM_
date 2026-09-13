import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/business/sales — List all sales for the authenticated user
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data, error } = await supabase
    .from('business_orders')
    .select('*')
    .eq('user_id', user.id)
    .order('order_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sales: data })
}

// POST /api/business/sales — Create a new sale (order)
export async function POST(req: NextRequest) {
  // This will be handled by the POST /api/business/orders route
  return new Response('Use /orders endpoint to create sales', { status: 200 })
}