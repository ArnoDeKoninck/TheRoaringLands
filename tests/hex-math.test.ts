import { colRowToKey, keyToColRow, hexToPixel, neighborsOf, hexPolygonPoints, gridPixelSize } from '@/lib/hex-math'

describe('colRowToKey', () => {
  test('encodes col,row as string', () => {
    expect(colRowToKey(3, 5)).toBe('3,5')
    expect(colRowToKey(0, 0)).toBe('0,0')
  })
})

describe('keyToColRow', () => {
  test('decodes string to [col, row]', () => {
    expect(keyToColRow('3,5')).toEqual([3, 5])
    expect(keyToColRow('0,0')).toEqual([0, 0])
  })

  test('round-trips through colRowToKey', () => {
    expect(keyToColRow(colRowToKey(7, 12))).toEqual([7, 12])
  })
})

describe('hexToPixel', () => {
  test('even row: no x offset', () => {
    const { x, y } = hexToPixel(0, 0, 48)
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(0)
  })

  test('odd row: offset by half hex-width', () => {
    const { x, y } = hexToPixel(0, 1, 48)
    // W = 48 * sqrt(3) ≈ 83.138, half = 41.569
    expect(x).toBeCloseTo(41.569, 1)
    expect(y).toBeCloseTo(72, 1)   // row 1 * 0.75 * 96
  })

  test('col 1 row 0: one hex-width right', () => {
    const { x } = hexToPixel(1, 0, 48)
    expect(x).toBeCloseTo(83.138, 1)
  })
})

describe('neighborsOf', () => {
  test('even row returns 6 neighbors', () => {
    expect(neighborsOf(5, 4)).toHaveLength(6)
  })

  test('odd row returns 6 neighbors', () => {
    expect(neighborsOf(5, 3)).toHaveLength(6)
  })

  test('even row: right neighbor is [col+1, row]', () => {
    const neighbors = neighborsOf(5, 4)
    expect(neighbors).toContainEqual([6, 4])
  })

  test('even row: NE neighbor is [col, row-1]', () => {
    const neighbors = neighborsOf(5, 4)
    expect(neighbors).toContainEqual([5, 3])
  })

  test('odd row: NE neighbor is [col+1, row-1]', () => {
    const neighbors = neighborsOf(5, 3)
    expect(neighbors).toContainEqual([6, 2])
  })

  test('even row: SW neighbor is [col-1, row+1]', () => {
    const neighbors = neighborsOf(5, 4)
    expect(neighbors).toContainEqual([4, 5])
  })
})

describe('hexPolygonPoints', () => {
  test('returns 6 coordinate pairs for radius 48', () => {
    const pts = hexPolygonPoints(48)
    const pairs = pts.trim().split(' ')
    expect(pairs).toHaveLength(6)
  })

  test('first point is top-center (x = w/2, y = 0)', () => {
    const pts = hexPolygonPoints(48)
    const [first] = pts.split(' ')
    const [x, y] = first.split(',').map(Number)
    expect(x).toBeCloseTo(41.569, 1)  // 48 * sqrt(3) / 2
    expect(y).toBeCloseTo(0)
  })
})

describe('gridPixelSize', () => {
  test('returns positive width and height', () => {
    const { width, height } = gridPixelSize(30, 24, 48)
    expect(width).toBeGreaterThan(0)
    expect(height).toBeGreaterThan(0)
  })

  test('width increases with more columns', () => {
    const { width: w1 } = gridPixelSize(10, 10, 48)
    const { width: w2 } = gridPixelSize(20, 10, 48)
    expect(w2).toBeGreaterThan(w1)
  })
})
