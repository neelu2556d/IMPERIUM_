/**
 * Leading per-tile metrics for the dashboard, read live from each module's
 * store. A tile shows its metric only when there's real data; otherwise the
 * field is null and the tile renders no stat (no fake placeholder). As more
 * modules gain server-readable data, add a field here and a branch in VeeTiles
 * — the metric returns automatically once the data exists.
 *
 * Today: Train (most recent logged session) and Fuel (today's calories) are the
 * only tiles with server-readable data. Vitals / Peak / Brand / Finance have no
 * live source yet, so they intentionally show nothing.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getLocalDayKey } from '@/lib/nutrition/dayKey'

export interface DashboardTileStats {
  /** Most recent logged workout's day name (e.g. "Push A"), or null if none. */
  trainDay: string | null
  /** Today's logged calories (4am rollover), or null if nothing logged today. */
  fuelKcalToday: number | null
}

export interface BusinessTileStats {
  /** Total sales in the last 30 days, or null if no data. */
  totalMonthlySales: number | null
  /** Number of active lots, or null if no data. */
  activeLots: number | null
}

const EMPTY: DashboardTileStats = { trainDay: null, fuelKcalToday: null }
const EMPTY_BUSINESS: BusinessTileStats = { totalMonthlySales: null, activeLots: null }

export async function getDashboardTileStats(
  supabase: SupabaseClient,
  userId: string,
  /**
   * The user's LOCAL "today" day key (from the `vitality_local_date` cookie
   * LocalDateSync writes). This runs in a Server Component, so `getLocalDayKey()`
   * would use Vercel's UTC clock — for a user west of UTC in the evening that is
   * already "tomorrow", so their logged calories vanish from the tile. Pass the
   * client's local date so "today" means their today. Falls back to the (wrong
   * for some users) server key only when the cookie is absent.
   */
  localDayKey?: string,
): Promise<DashboardTileStats> {
  const stats: DashboardTileStats = {
    trainDay: null,
    fuelKcalToday: null,
  }

  // Train — the most recent submitted session's day name.
  try {
    const { data } = await supabase
      .from('workouts')
      .select('day_name')
      .eq('user_id', userId)
      .not('submitted_at', 'is', null)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()
    const dayName = (data?.day_name as string | undefined)?.trim()
    if (dayName) stats.trainDay = dayName
  } catch {
    // leave null — the tile just shows no stat
  }

  // Fuel — today's logged calories. Prefer the client's local day key (cookie);
  // fall back to the server key only when it is absent.
  try {
    const { data: meals } = await supabase
      .from('nutrition_meals')
      .select('totals')
      .eq('user_id', userId)
      .eq('day_key', localDayKey ?? getLocalDayKey())
    const kcal = (meals ?? []).reduce(
      (sum, m) => sum + Number((m.totals as { kcal?: number } | null)?.kcal ?? 0),
      0,
    )
    if (kcal > 0) stats.fuelKcalToday = Math.round(kcal)
  } catch {
    // leave null
  }

  return stats
}

export async function getBusinessTileStats(
  supabase: SupabaseClient,
  userId: string,
): Promise<BusinessTileStats> {
  const stats: BusinessTileStats = { totalMonthlySales: null, activeLots: null }

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { data: orders } = await supabase
      .from('business_orders')
      .select('total_amount')
      .eq('user_id', userId)
      .gte('order_date', thirtyDaysAgo.toISOString().split('T')[0])
    if (orders) {
      stats.totalMonthlySales = orders.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0) || null
    }
  } catch {
    // leave null
  }

  try {
    const { data: lots } = await supabase
      .from('business_lots')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
    if (lots) {
      stats.activeLots = lots.length || null
    }
  } catch {
    // leave null
  }

  return stats
}