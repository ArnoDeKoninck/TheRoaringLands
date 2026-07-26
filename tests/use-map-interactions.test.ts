// @vitest-environment jsdom
import { getHexKeyFromElement } from '@/hooks/use-map-interactions'

describe('getHexKeyFromElement', () => {
  test('returns null for non-hex element', () => {
    const div = document.createElement('div')
    expect(getHexKeyFromElement(div)).toBeNull()
  })

  test('returns key for element with data-col/data-row', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('data-col', '3')
    svg.setAttribute('data-row', '5')
    expect(getHexKeyFromElement(svg)).toBe('3,5')
  })

  test('returns key when child element is inside hex svg', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('data-col', '2')
    svg.setAttribute('data-row', '4')
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    svg.appendChild(text)
    expect(getHexKeyFromElement(text)).toBe('2,4')
  })
})
