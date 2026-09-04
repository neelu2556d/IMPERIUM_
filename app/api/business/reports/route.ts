/**
 * Business Reports API — /api/business/reports
 * Access: writer.nishant2809@gmail.com only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isBusinessOwner, forbiddenResponse, unauthorizedResponse } from '@/lib/business/auth'

interface ReportPeriod {
  period: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly'
}

// GET /api/business/reports?period=monthly|quarterly|half_yearly|yearly
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return unauthorizedResponse()
  }

  if (!isBusinessOwner(user.email)) {
    return forbiddenResponse()
  }

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || 'monthly'

  // Validate period
  const validPeriods = ['monthly', 'quarterly', 'half_yearly', 'yearly']
  if (!validPeriods.includes(period)) {
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
  }

  // Determine date range based on period
  const now = new Date()
  let startDate: Date
  let groupBy: string

  switch (period) {
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      groupBy = 'YYYY-MM'
      break
    case 'quarterly':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      groupBy = 'YYYY-Q'
      break
    case 'half_yearly':
      startDate = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1)
      groupBy = 'YYYY-H'
      break
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1)
      groupBy = 'YYYY'
      break
  }

  try {
    // Fetch orders with joins
    const { data: orders, error: ordersError } = await supabase
      .from('business_orders')
      .select(`
        id,
        order_date,
        net_amount,
        total_amount,
        total_metres,
        status,
        party: business_parties (name),
        lot: business_lots (item_name)
      `)
      .gte('order_date', startDate.toISOString())
      .eq('status', 'completed')

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    // Aggregate per-day sales
    const perDaySale: Record<string, { date: string; total_amount: number }> = {}
    for (const order of (orders ?? [])) {
      const dateKey = new Date(order.order_date).toISOString().split('T')[0]
      if (!perDaySale[dateKey]) {
        perDaySale[dateKey] = { date: dateKey, total_amount: 0 }
      }
      perDaySale[dateKey].total_amount += Number(order.net_amount || 0)
    }
    const perDaySaleArray = Object.values(perDaySale).sort((a, b) => a.date.localeCompare(b.date))

    // Aggregate party-wise sales
    const partyWise: Record<string, { party_name: string; orders: number; total_metres: number; total_amount: number }> = {}
    for (const order of (orders ?? [])) {
      const partyName = order.party?.name || 'Unknown'
      if (!partyWise[partyName]) {
        partyWise[partyName] = { party_name: partyName, orders: 0, total_metres: 0, total_amount: 0 }
      }
      partyWise[partyName].orders += 1
      partyWise[partyName].total_metres += Number(order.total_metres || 0)
      partyWise[partyName].total_amount += Number(order.net_amount || 0)
    }
    const totalSales = Object.values(partyWise).reduce((sum, p) => sum + p.total_amount, 0)
    const partyWiseArray = Object.values(partyWise).map((p) => ({
      ...p,
      percent_of_sale: totalSales > 0 ? Math.round((p.total_amount / totalSales) * 100) : 0,
    }))

    // Summary
    const summary = {
      total_orders: orders?.length ?? 0,
      total_metres: orders?.reduce((sum, o) => sum + Number(o.total_metres || 0), 0) ?? 0,
      total_net: orders?.reduce((sum, o) => sum + Number(o.net_amount || 0), 0) ?? 0,
    }

    return NextResponse.json({
      period,
      summary,
      per_day_sale: perDaySaleArray,
      party_wise: partyWiseArray,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}