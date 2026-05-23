import { describe, it, expect } from 'vitest'
import { safeHref, sanitiseSkill } from './urlSafety'

describe('safeHref', () => {
  it('allows https URLs', () => {
    expect(safeHref('https://example.com/job/42')).toBe('https://example.com/job/42')
  })

  it('allows http URLs', () => {
    expect(safeHref('http://example.com')).toBe('http://example.com')
  })

  it('blocks javascript: URLs', () => {
    expect(safeHref('javascript:alert(1)')).toBe('#')
  })

  it('blocks data: URLs', () => {
    expect(safeHref('data:text/html,<script>alert(1)</script>')).toBe('#')
  })

  it('returns # for null', () => expect(safeHref(null)).toBe('#'))
  it('returns # for undefined', () => expect(safeHref(undefined)).toBe('#'))
  it('returns # for empty string', () => expect(safeHref('')).toBe('#'))
  it('returns # for a bare word (invalid URL)', () => expect(safeHref('notaurl')).toBe('#'))
})

describe('sanitiseSkill', () => {
  it('lowercases and trims', () => {
    expect(sanitiseSkill('  Python  ')).toBe('python')
  })

  it('allows alphanumeric with special chars', () => {
    expect(sanitiseSkill('scikit-learn')).toBe('scikit-learn')
    expect(sanitiseSkill('c++')).toBe('c++')
    expect(sanitiseSkill('node.js')).toBe('node.js')
  })

  it('rejects strings with HTML tags', () => {
    expect(sanitiseSkill('<script>alert(1)</script>')).toBe('')
  })

  it('rejects strings longer than 50 chars', () => {
    expect(sanitiseSkill('a'.repeat(51))).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(sanitiseSkill('')).toBe('')
  })
})
