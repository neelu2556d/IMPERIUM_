import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/business/reports — List all reports for the authenticated user
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data, error } = await supabase
    .from('business_morning_briefings')
    .select('*')
    .eq('user_id', user.id)
    .order('briefing_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reports: data })
}

// POST /api/business/reports — Create a new report (morning briefing)
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const {
    briefing_date,
    content,
    mode,
  } = body

  if (!briefing_date || !content) {
    return NextResponse.json({ error: 'briefing_date and content are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('business_morning_briefings')
    .insert({
      user_id: user.id,
      briefing_date,
      content,
      mode: mode || 'chat',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ report: data }, { status: 201 })
}