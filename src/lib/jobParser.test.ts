import { describe, it, expect } from 'vitest'
import { parseJobFromRss } from './jobParser'
import type { RawRssItem } from '../types'

function makeItem(overrides: Partial<RawRssItem> = {}): RawRssItem {
  return {
    title: 'Senior Data Engineer — Acme AG',
    link: 'https://example.com/job/123',
    description: 'We are looking for a Python and SQL expert with Spark experience.',
    pubDate: '2024-06-01T10:00:00Z',
    ...overrides,
  }
}

describe('parseJobFromRss', () => {
  it('extracts title before separator', () => {
    const job = parseJobFromRss(makeItem(), 'arbeitnow', [])
    expect(job.title).toBe('Senior Data Engineer')
  })

  it('extracts company after separator', () => {
    const job = parseJobFromRss(makeItem(), 'arbeitnow', [])
    expect(job.company).toBe('Acme AG')
  })

  it('falls back to full title when no separator present', () => {
    const item = makeItem({ title: 'Data Scientist' })
    const job = parseJobFromRss(item, 'arbeitnow', [])
    expect(job.title).toBe('Data Scientist')
  })

  it('uses source name as company fallback', () => {
    const item = makeItem({ title: 'Data Scientist' })
    const job = parseJobFromRss(item, 'arbeitnow', [])
    expect(job.company).toBe('arbeitnow')
  })

  it('sets source field correctly', () => {
    const job = parseJobFromRss(makeItem(), 'jobicy', [])
    expect(job.source).toBe('jobicy')
  })

  it('sets url from link', () => {
    const job = parseJobFromRss(makeItem(), 'arbeitnow', [])
    expect(job.url).toBe('https://example.com/job/123')
  })

  it('generates a stable id from the same link', () => {
    const item = makeItem()
    const id1 = parseJobFromRss(item, 'arbeitnow', []).id
    const id2 = parseJobFromRss(item, 'arbeitnow', []).id
    expect(id1).toBe(id2)
  })

  it('extracts requiredSkills from title + description', () => {
    const job = parseJobFromRss(makeItem(), 'arbeitnow', [])
    expect(job.requiredSkills).toContain('python')
    expect(job.requiredSkills).toContain('sql')
  })

  it('computes matchScore based on user skills', () => {
    const job = parseJobFromRss(makeItem(), 'arbeitnow', ['python', 'sql'])
    expect(job.matchScore).toBeGreaterThan(0)
    expect(job.matchedSkills).toContain('python')
  })

  it('score is 0 when no skills are extracted', () => {
    const item = makeItem({ title: 'Office Manager', description: 'No technical skills required.' })
    const job = parseJobFromRss(item, 'arbeitnow', ['python'])
    expect(job.matchScore).toBe(0)
  })

  it('truncates long descriptions to 500 chars + ellipsis', () => {
    const longDesc = 'x'.repeat(600)
    const job = parseJobFromRss(makeItem({ description: longDesc }), 'arbeitnow', [])
    expect(job.rawDescription.length).toBeLessThanOrEqual(501) // 500 + '…'
    expect(job.rawDescription.endsWith('…')).toBe(true)
  })

  it('keeps short descriptions unchanged', () => {
    const item = makeItem({ description: 'Short description.' })
    const job = parseJobFromRss(item, 'arbeitnow', [])
    expect(job.rawDescription).toBe('Short description.')
  })

  it('sets location from item', () => {
    const item = makeItem({ location: 'Zürich, CH' })
    const job = parseJobFromRss(item, 'arbeitnow', [])
    expect(job.location).toBe('Zürich, CH')
  })

  it('sets empty location when item has none', () => {
    const job = parseJobFromRss(makeItem(), 'arbeitnow', [])
    expect(job.location).toBe('')
  })
})
