import { describe, expect, it } from 'vitest'
import { connectorColor, PASTEL_COLORS } from '../utils/pastel-colors'

describe('pastel-colors', () => {
  it('exports exactly 8 colors', () => {
    expect(PASTEL_COLORS).toHaveLength(8)
  })

  it('all 8 colors are distinct', () => {
    const unique = new Set(PASTEL_COLORS)
    expect(unique.size).toBe(8)
  })

  it('all colors are valid oklch strings', () => {
    for (const color of PASTEL_COLORS) {
      expect(color).toMatch(/^oklch\(/)
    }
  })

  it('connectorColor returns the correct color for indices 0-7', () => {
    for (let i = 0; i < 8; i++) {
      expect(connectorColor(i)).toBe(PASTEL_COLORS[i])
    }
  })

  it('connectorColor cycles at index 8+', () => {
    expect(connectorColor(8)).toBe(PASTEL_COLORS[0])
    expect(connectorColor(9)).toBe(PASTEL_COLORS[1])
    expect(connectorColor(15)).toBe(PASTEL_COLORS[7])
    expect(connectorColor(16)).toBe(PASTEL_COLORS[0])
  })
})
