import { homeLayout } from '@/lib/tiles/homeLayout'
import { DEFAULT_HOME_ORDER, CREATE_TILE, LIBRARY_TILE } from '@/lib/tiles/coreTiles'

const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
  clear: () => { for (const k in store) delete store[k] },
  length: 0,
  key: () => null,
}
Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock }, writable: true })

const A = 'user-a'
const homeKey = (userId: string) => `vitality:${userId}:home`
beforeEach(() => localStorageMock.clear())

describe('homeLayout: the optional Create tile', () => {
  test('a fresh dashboard does NOT include the Create tile (it is optional)', () => {
    expect(homeLayout.getOrder(A)).not.toContain(CREATE_TILE.id)
  })

  test('the seeded default arrangement does NOT include the Create tile', () => {
    expect(DEFAULT_HOME_ORDER).not.toContain(CREATE_TILE.id)
  })

  test('adding Create manually works', () => {
    homeLayout.add(A, CREATE_TILE.id)
    expect(homeLayout.getOrder(A)).toContain(CREATE_TILE.id)
  })

  test('Create is removable', () => {
    homeLayout.add(A, CREATE_TILE.id)
    homeLayout.remove(A, CREATE_TILE.id)
    expect(homeLayout.getOrder(A)).not.toContain(CREATE_TILE.id)
  })
})
