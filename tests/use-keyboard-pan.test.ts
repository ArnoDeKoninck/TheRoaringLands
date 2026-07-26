import { getPanDelta } from '@/hooks/use-keyboard-pan'

describe('getPanDelta', () => {
  test('ArrowLeft returns positive x delta', () => {
    const { dx, dy } = getPanDelta('ArrowLeft', 8)
    expect(dx).toBe(8)
    expect(dy).toBe(0)
  })

  test('ArrowRight returns negative x delta', () => {
    const { dx, dy } = getPanDelta('ArrowRight', 8)
    expect(dx).toBe(-8)
    expect(dy).toBe(0)
  })

  test('ArrowUp returns positive y delta', () => {
    const { dx, dy } = getPanDelta('ArrowUp', 8)
    expect(dx).toBe(0)
    expect(dy).toBe(8)
  })

  test('ArrowDown returns negative y delta', () => {
    const { dx, dy } = getPanDelta('ArrowDown', 8)
    expect(dx).toBe(0)
    expect(dy).toBe(-8)
  })

  test('w maps same as ArrowUp', () => {
    expect(getPanDelta('w', 8)).toEqual(getPanDelta('ArrowUp', 8))
  })

  test('a maps same as ArrowLeft', () => {
    expect(getPanDelta('a', 8)).toEqual(getPanDelta('ArrowLeft', 8))
  })

  test('unknown key returns zero delta', () => {
    expect(getPanDelta('q', 8)).toEqual({ dx: 0, dy: 0 })
  })
})
