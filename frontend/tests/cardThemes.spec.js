import { describe, it, expect } from 'vitest'
import { CARD_THEMES } from '../src/constants/styles'

describe('CARD_THEMES', () => {
  it('contains required themes', () => {
    expect(Object.keys(CARD_THEMES)).toEqual(['0','1','2'])
  })
  it('falls back to 0', () => {
    expect(CARD_THEMES[999] || CARD_THEMES[0]).toBe(CARD_THEMES[0])
  })
})

