// Pointy-top hex grid, odd-r offset (odd rows shift right by half hex-width)

export function colRowToKey(col: number, row: number): string {
  return `${col},${row}`
}

export function keyToColRow(key: string): [number, number] {
  const [col, row] = key.split(',').map(Number)
  return [col, row]
}

export function hexToPixel(col: number, row: number, radius: number): { x: number; y: number } {
  const w = radius * Math.sqrt(3)
  const h = 2 * radius
  const x = col * w + (row % 2 !== 0 ? w / 2 : 0)
  const y = row * (h * 0.75)
  return { x, y }
}

// Odd-r offset neighbor directions for pointy-top hexes
export function neighborsOf(col: number, row: number): [number, number][] {
  const isOdd = row % 2 !== 0
  return isOdd
    ? [
        [col + 1, row],     // E
        [col - 1, row],     // W
        [col + 1, row - 1], // NE
        [col,     row - 1], // NW
        [col + 1, row + 1], // SE
        [col,     row + 1], // SW
      ]
    : [
        [col + 1, row],     // E
        [col - 1, row],     // W
        [col,     row - 1], // NE
        [col - 1, row - 1], // NW
        [col,     row + 1], // SE
        [col - 1, row + 1], // SW
      ]
}

// Odd-r offset to cube: q = col - (row - (row & 1)) / 2, r = row
export function hexDistance(col1: number, row1: number, col2: number, row2: number): number {
  const q1 = col1 - (row1 - (row1 & 1)) / 2
  const q2 = col2 - (row2 - (row2 & 1)) / 2
  return Math.max(Math.abs(q1 - q2), Math.abs(row1 - row2), Math.abs(q2 + row2 - q1 - row1))
}

export function hexPolygonPoints(radius: number): string {
  const w = radius * Math.sqrt(3)
  const h = 2 * radius
  return `${w / 2},0 ${w},${h / 4} ${w},${3 * h / 4} ${w / 2},${h} 0,${3 * h / 4} 0,${h / 4}`
}

export function gridPixelSize(cols: number, rows: number, radius: number): { width: number; height: number } {
  const w = radius * Math.sqrt(3)
  const h = 2 * radius
  return {
    width:  cols * w + w / 2,
    height: rows * h * 0.75 + h * 0.25,
  }
}
