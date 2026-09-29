import { describe, expect, it } from 'vitest'

import { csvCell, toTel, toWhatsApp } from '@/admin/leads/format'

describe('toWhatsApp (Israeli phone formats)', () => {
  it.each([
    ['050-1234567', '972501234567'],
    ['0501234567', '972501234567'],
    ['050 123 4567', '972501234567'],
    ['501234567', '972501234567'],
    ['+972 50-123-4567', '972501234567'],
    ['+972501234567', '972501234567'],
    ['00972501234567', '972501234567'],
    ['9720501234567', '972501234567'],
    ['04-6310000', '97246310000'],
    ['0599123456', '970599123456'],
    ['0569123456', '970569123456'],
    ['+970 599 123 456', '970599123456'],
  ])('%s → %s', (input, out) => expect(toWhatsApp(input)).toBe(out))
})

describe('toTel', () => {
  it('keeps digits and +', () => expect(toTel('+972 (50) 123-4567')).toBe('+972501234567'))
})

describe('csvCell', () => {
  it('quotes and escapes', () => expect(csvCell('قال "مرحبا"\nسطر')).toBe('"قال ""مرحبا"" سطر"'))
  it('neutralises formulas from the public form', () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe(`"'=HYPERLINK(""http://x"")"`)
    expect(csvCell('+1')).toBe(`"'+1"`)
    expect(csvCell('@SUM(A1)')).toBe(`"'@SUM(A1)"`)
  })
  it('keeps the leading 0 of phone numbers in Excel', () => {
    expect(csvCell('050-1234567', 'phone')).toBe('="050-1234567"')
    expect(csvCell('+972501234567', 'phone')).toBe('="+972501234567"')
  })
  it('empty values', () => expect(csvCell(null)).toBe('""'))
})
