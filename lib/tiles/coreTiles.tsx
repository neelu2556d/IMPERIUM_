import type { ReactNode } from 'react'
import type { TileSize } from './tileSkin'
import type { DashboardTileStats } from '@/lib/vitality/dashboardStats'

export type CoreTileId =
  | 'train'
  | 'fuel'
  | 'vitals'
  | 'peak'
  | 'brand'
  | 'finance'
  | 'business'

const CORE_IDS = new Set<CoreTileId>(['train', 'fuel', 'vitals', 'peak', 'brand', 'finance', 'business'])

/** Whether an id belongs to a core tile. */
export function isCoreId(id: string): id is CoreTileId {
  return CORE_IDS.has(id as CoreTileId)
}

export function isLibraryId(id: string): boolean { return false }
export function isCreateId(id: string): boolean { return false }
export function isForgeId(id: string): boolean { return false }

/** Default size for a core tile that has never been customized. */
export function coreDefaultSize(id: CoreTileId): TileSize {
  const sizes: Record<CoreTileId, TileSize> = {
    train: 'hero',
    fuel: 'tall',
    vitals: 's',
    peak: 'tall',
    brand: 'tall',
    finance: 'tall',
    business: 'tall',
  }
  return sizes[id] ?? 'm'
}

/** Map of core tile id → default TileSize. */
export const CORE_TILE_SIZES = {
  train: 'hero',
  fuel: 'tall',
  vitals: 's',
  peak: 'tall',
  brand: 'tall',
  finance: 'tall',
  business: 'tall',
}

/**
 * The core tiles are Vitality's pre-installed apps (Train, Fuel, Vitals, Peak,
 * Brand, Finance, Business). On the fused dashboard they live in the SAME grid as
 * a user's own built tiles, so they can be dragged, resized, removed, and
 * re-added from the library just like any tile. This registry is the static
 * source of truth for each one: its route, index, label, glyph, the bespoke
 * animated orb art, the animation data-attributes, and a default size.
 *
 * Vee is intentionally NOT in this list. Vee is the locked centrepiece, rendered
 * by its own component (it carries the live score, the wire feeds, the ring
 * pulse). It can never be dragged or removed. See VEE_TILE below + DashboardGrid.
 *
 * The art SVGs use the default preserveAspectRatio (meet), so they scale without
 * distortion as a tile is resized; the orb animation in veeTilesAnim.ts reads
 * path geometry in viewBox coordinates, so the living orbs keep tracking their
 * path at any tile size.
 *
 * Every orb <g> ALSO carries a static `transform="translate(cx cy)"` placing it
 * on its art at rest. This is load-bearing, not decoration: veeTilesAnim positions
 * the orb imperatively, and if that placement hasn't run at paint time (effect
 * timing) or is skipped (an error in the Vee-centre loop), an orb with no static
 * transform falls back to viewBox (0,0) — the tile's top-left corner — where
 * overflow:hidden clips it into a "glitching off the tile" sliver. The static
 * rest point makes the orb correct with zero JS; the animation just takes over
 * from there. (Library already did this on its own orb; every tile now does.)
 */

export type CoreTileId =
  | 'train'
  | 'fuel'
  | 'vitals'
  | 'peak'
  | 'brand'
  | 'finance'
  | 'business'

/** A single live metric to surface on a tile (Train day, Fuel kcal). */
export interface CoreStat {
  value: string
  unit: string
}

export interface CoreTile {
  id: CoreTileId
  href: string
  /** Corner index label, e.g. "01". */
  index: string
  /** Bottom-left tile title. */
  label: string
  /** Extra tile classes: 'live' = graph tile (metric on the title baseline),
   *  'fin' = finance gold accent. */
  variant?: string
  /** Animation hooks consumed by veeTilesAnim.ts. */
  orb?: { mode?: string; roam?: string; pt?: string }
  /** The top-right glyph. */
  glyph: ReactNode
  /** The animated orb art layer (the .art SVG contents). */
  art: ReactNode
  /** Default size on a fresh dashboard (matches the approved customize mockup). */
  defaultSize: TileSize
  /** Resolve this tile's one glanceable live stat, or null to show none. */
  stat?: (stats: DashboardTileStats) => CoreStat | null
}

export const CORE_TILES: Record<CoreTileId, CoreTile> = {
  train: {
    id: 'train',
    href: '/app/fitness/log',
    index: '01',
    label: 'Train',
    variant: 'live',
    orb: { mode: 'wander' },
    defaultSize: 'hero',
    glyph: (
      <svg viewBox="-12 -12 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <rect x="-10" y="-3" width="2.8" height="6" rx="0.6" strokeWidth="1.3" />
        <rect x="7.2" y="-3" width="2.8" height="6" rx="0.6" strokeWidth="1.3" />
        <line x1="-7.2" y1="0" x2="7.2" y2="0" strokeWidth="1.3" />
      </svg>
    ),
    art: (
      <svg className="art" viewBox="0 0 658 118">
        <path className="mot" d="M44 66 L180 54 L300 60 L440 37 L530 45 L616 27" />
        <g className="orb" transform="translate(300 60)"><circle className="glow" r="10" /><circle className="node" r="3.4" /></g>
      </svg>
    ),
    stat: (s) => (s.trainDay ? { value: s.trainDay, unit: 'day' } : null),
  },
  fuel: {
    id: 'fuel',
    href: '/app/fuel',
    index: '02',
    label: 'Fuel',
    orb: { mode: 'wander' },
    defaultSize: 'tall',
    glyph: (
      <svg viewBox="-12 -12 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M0 -10 C0 -10 -7 -2 -7 3 a7 7 0 0 0 14 0 C7 -2 0 -10 0 -10 Z" />
      </svg>
    ),
    art: (
      <svg className="art" viewBox="0 0 210 250">
        <path className="mot" d="M46 110 Q82 94 106 110 T168 110" />
        <path className="motd" d="M46 132 Q82 116 106 132 T168 132" />
        <g className="orb" transform="translate(106 110)"><circle className="glow" r="10" /><circle className="node" r="3.4" /></g>
      </svg>
    ),
    stat: (s) =>
      s.fuelKcalToday != null
        ? { value: s.fuelKcalToday.toLocaleString('en-US'), unit: 'kcal' }
        : null,
  },
  vitals: {
    id: 'vitals',
    href: '/app/vitals',
    index: '03',
    label: 'Vitals',
    variant: 'live',
    orb: { mode: 'wander' },
    defaultSize: 's',
    glyph: (
      <svg viewBox="-12 -12 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M-10 0 L-5 0 L-2 -7 L2 7 L5 0 L10 0" />
      </svg>
    ),
    art: (
      <svg className="art" viewBox="0 0 210 118">
        <path className="mot" d="M38 47 L74 47 L89 27 L104 70 L119 47 L172 47" />
        <g className="orb" transform="translate(104 70)"><circle className="glow" r="8" /><circle className="node" r="3.2" /></g>
      </svg>
    ),
  },
  peak: {
    id: 'peak',
    href: '/app/peak',
    index: '04',
    label: 'Peak',
    orb: { mode: 'still', roam: 'ring', pt: '105,125' },
    defaultSize: 'tall',
    glyph: (
      <svg viewBox="-12 -12 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M2 -10 L-5 1 L0 1 L-2 10 L5 -1 L0 -1 L2 -10 Z" />
      </svg>
    ),
    art: (
      <svg className="art" viewBox="0 0 210 250">
        <circle className="mot" cx="105" cy="125" r="40" />
        <g className="orb" transform="translate(105 125)"><circle className="glow" r="12" /><circle className="node" r="3.4" /></g>
      </svg>
    ),
  },
  brand: {
    id: 'brand',
    href: '/app/brand',
    index: '05',
    label: 'Brand',
    orb: { mode: 'still', roam: 'spoke', pt: '105,112' },
    defaultSize: 'tall',
    glyph: (
      <svg viewBox="-12 -12 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        <path d="M-8 -5 L0 9 L8 -5" />
      </svg>
    ),
    art: (
      <svg className="art" viewBox="0 0 210 250">
        <g style={{ opacity: 0.65 }}>
          <line className="motd" x1="105" y1="112" x2="105" y2="68" /><line className="motd" x1="105" y1="112" x2="145" y2="90" />
          <line className="motd" x1="105" y1="112" x2="145" y2="134" /><line className="motd" x1="105" y1="112" x2="65" y2="134" />
          <line className="motd" x1="105" y1="112" x2="65" y2="90" />
        </g>
        <g className="orb" transform="translate(105 112)"><circle className="glow" r="10" /><circle className="node" r="3.4" /></g>
      </svg>
    ),
  },
  finance: {
    id: 'finance',
    href: '/app/finance',
    index: '06',
    label: 'Finance',
    variant: 'fin',
    orb: { mode: 'hop', roam: 'spoke', pt: '105,118' },
    defaultSize: 'tall',
    glyph: (
      <svg viewBox="-12 -12 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M-9 8 L0 -9 L9 8 Z" />
        <line x1="-5" y1="0" x2="5" y2="0" strokeWidth="1.2" />
      </svg>
    ),
    art: (
      <svg className="art" viewBox="0 0 210 250">
        <path className="mot" d="M30 195 L70 175 L100 165 L130 145 L160 130 L190 115" />
        <path className="motd" d="M30 215 L60 200 L90 190 L120 180 L150 170 L180 160" />
        <g className="orb" transform="translate(105 118)"><circle className="glow" r="11" /><circle className="node" r="3.4" /></g>
      </svg>
    ),
    stat: (s) => null, // Finance shows no live tile stat; main page metrics live there.
  },
  business: {
    id: 'business',
    href: '/app/business',
    index: '07',
    label: 'Business',
    variant: 'live',
    orb: { mode: 'wander' },
    defaultSize: 'tall',
    glyph: (
      <svg viewBox="-12 -12 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M6 2 L3 6 L21 6" />
        <path d="M6 12 L3 16 L21 16" />
        <path d="M6 18 L3 22 L21 22" />
      </svg>
    ),
    art: (
      <svg className="art" viewBox="0 0 210 250">
        <path className="mot" d="M46 110 Q82 94 106 110 T168 110" />
        <path className="motd" d="M46 132 Q82 116 106 132 T168 132" />
        <g className="orb" transform="translate(106 110)"><circle className="glow" r="10" /><circle className="node" r="3.4" /></g>
      </svg>
    ),
    stat: (s) => {
      const total = s.totalMonthlySales || 0
      return total > 0
        ? { value: total.toLocaleString('en-US'), unit: '₹' }
        : { value: '—', unit: '₹' }
    },
  },
}
