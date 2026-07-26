import { createStore } from 'zustand/vanilla'
import { createGameSlice, type GameState } from '@/lib/store/game-store'

function makeStore(overrides: Partial<GameState> = {}) {
  return createStore<GameState>((set, get) => ({
    ...createGameSlice(set as (fn: (s: GameState) => Partial<GameState>) => void, get),
    ...overrides,
  }))
}

describe('selection', () => {
  test('selectHex sets selectedKeys to single key', () => {
    const store = makeStore()
    store.getState().selectHex('3,4', false, false)
    expect(store.getState().selectedKeys).toEqual(new Set(['3,4']))
  })

  test('selectHex with ctrl adds to selection', () => {
    const store = makeStore()
    store.getState().selectHex('3,4', false, false)
    store.getState().selectHex('5,6', true, false)
    expect(store.getState().selectedKeys).toEqual(new Set(['3,4', '5,6']))
  })

  test('selectHex ctrl on already-selected key removes it', () => {
    const store = makeStore()
    store.getState().selectHex('3,4', false, false)
    store.getState().selectHex('3,4', true, false)
    expect(store.getState().selectedKeys).toEqual(new Set())
  })

  test('clearSelection empties selectedKeys', () => {
    const store = makeStore()
    store.getState().selectHex('3,4', false, false)
    store.getState().clearSelection()
    expect(store.getState().selectedKeys).toEqual(new Set())
  })

  test('paintSelect adds key to selection', () => {
    const store = makeStore()
    store.getState().paintSelect('1,1')
    store.getState().paintSelect('2,2')
    expect(store.getState().selectedKeys).toEqual(new Set(['1,1', '2,2']))
  })

  test('setInspectedKey updates inspectedKey', () => {
    const store = makeStore()
    store.getState().setInspectedKey('5,5')
    expect(store.getState().inspectedKey).toBe('5,5')
  })

  test('setInspectedKey null clears', () => {
    const store = makeStore()
    store.getState().setInspectedKey('5,5')
    store.getState().setInspectedKey(null)
    expect(store.getState().inspectedKey).toBeNull()
  })
})
