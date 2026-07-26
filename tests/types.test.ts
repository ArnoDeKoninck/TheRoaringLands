import { RESOURCE_CONFIG } from '@/lib/types'
import { test, expect } from 'vitest'

test('RESOURCE_CONFIG has 5 resources', () => {
  expect(RESOURCE_CONFIG).toHaveLength(5)
})

test('all resources have 2-char code and oklch color', () => {
  for (const r of RESOURCE_CONFIG) {
    expect(r.key).toBeTruthy()
    expect(r.code).toHaveLength(2)
    expect(r.color).toMatch(/^oklch/)
  }
})
