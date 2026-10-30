/**
 * Unit tests of the chart label layout helpers (Task 923, Revision 7): word wrap that never cuts a word, the category axis stride, and the
 * radar radius that follows the real labels. The text measure is replaced by a fixed 7px per character so the expectations are exact.
 */
import { describe, expect, it } from 'vitest'
import { fitLabelCount, labelStride, plotWidthOf, radarRadius, textWidth, widestLine, wrapLabel } from '../dashboardChartLabels'

const FONT = '12px sans-serif'
// jsdom has no canvas: `textWidth` falls back to 0.55 x the font size per character = 6.6px per character at 12px
const CHAR = 12 * 0.55

describe('textWidth fallback', () => {
  it('measures by character count where there is no canvas', () => {
    expect(textWidth('abcd', FONT)).toBeCloseTo(4 * CHAR)
  })
})

describe('wrapLabel', () => {
  it('breaks only at spaces and keeps every word whole', () => {
    const lines = wrapLabel('Modern Apartment in Tirana Center', 14 * CHAR, FONT)
    // 92.4px per line: 'Modern Apartment' is 105.6px, 'Apartment in Tirana' 125.4px, 'Tirana Center' 85.8px
    expect(lines).toEqual(['Modern', 'Apartment in', 'Tirana Center'])
    expect(lines.join(' ')).toBe('Modern Apartment in Tirana Center')
  })

  it('puts a word wider than the limit on its own line instead of cutting it', () => {
    expect(wrapLabel('Повідомлення тут', 3 * CHAR, FONT)).toEqual(['Повідомлення', 'тут'])
  })

  it('maxWidth 0 gives every word its own line, and a single word stays one line', () => {
    expect(wrapLabel('Office Space in Kombinat', 0, FONT)).toEqual(['Office', 'Space', 'in', 'Kombinat'])
    expect(wrapLabel('Views', 0, FONT)).toEqual(['Views'])
  })

  it('never returns an empty list', () => {
    expect(wrapLabel('', 10, FONT)).toEqual([''])
  })
})

describe('axis stride', () => {
  it('keeps the ends and never more labels than categories', () => {
    expect(fitLabelCount(1000, 20, 10, 12)).toBe(12)
    expect(fitLabelCount(50, 40, 10, 12)).toBe(2)
    expect(fitLabelCount(1000, 20, 10, 2)).toBe(2)
  })

  it('draws every label when they fit with a gap, every n-th when they do not', () => {
    // 12 labels of 20px with a 10px gap need 12 x 20 + 11 x 10 = 350px
    expect(labelStride(350, 20, 10, 12)).toBe(1)
    // a 246px phone box less a 14px y label and 4 gaps of 10px = a 192px plot: floor((192 + 10) / 30) = 6 labels fit -> stride ceil(12 / 6) = 2
    expect(plotWidthOf(246, 14, 10)).toBe(192)
    expect(labelStride(192, 20, 10, 12)).toBe(2)
    // 120px fits 4 labels (4 x 20 + 3 x 10 = 110) -> every 3rd of 12, which draws exactly 4
    expect(labelStride(120, 20, 10, 12)).toBe(3)
  })

  it('the drawn labels (0, stride, 2 x stride ...) always fit the plot with their gaps', () => {
    for (const available of [120, 200, 246, 316, 566, 1000]) {
      for (const total of [3, 7, 12, 30]) {
        const stride = labelStride(available, 30, 10, total)
        const drawn = Math.ceil(total / stride)
        if (drawn > 2) expect(drawn * 30 + (drawn - 1) * 10).toBeLessThanOrEqual(available)
      }
    }
  })
})

describe('radarRadius', () => {
  const numbers = ['1', '2', '3', '4', '5', '6'].map((n) => [n])

  it('is never larger than the maximum', () => {
    expect(radarRadius(numbers, FONT, 16.8, 10, 600, 600, 100)).toBe(100)
  })

  it('shrinks so the widest side label still fits the box on both sides', () => {
    const labels = [['Views'], ['Inquiries'], ['Calls'], ['Messages'], ['Visits'], ['Offers']]
    const width = 246
    const r = radarRadius(labels, FONT, 16.8, 10, width, width, 200)
    // a side label (30 degrees from horizontal) starts 10px beyond its vertex: vertex x + 10 + label width <= half the box
    const widest = widestLine([labels[1]], FONT)
    expect(r * Math.cos(Math.PI / 6) + 10 + widest).toBeLessThanOrEqual(width / 2 + 1)
  })

  it('a numbered radar is larger than the same radar with long names, in the same box', () => {
    const names = [['Visualizzazioni'], ['Richieste'], ['Chiamate'], ['Messaggi'], ['Visite'], ['Offerte']]
    expect(radarRadius(numbers, FONT, 16.8, 10, 246, 246, 200)).toBeGreaterThan(radarRadius(names, FONT, 16.8, 10, 246, 246, 200))
  })

  it('is 0 rather than negative when nothing fits', () => {
    expect(radarRadius([['A very long label that cannot fit']], FONT, 16.8, 10, 40, 40, 100)).toBe(0)
  })
})
