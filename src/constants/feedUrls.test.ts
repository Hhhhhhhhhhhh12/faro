import { describe, it, expect } from 'vitest'
import { buildFeeds, DEFAULT_SEARCH } from './feedUrls'

describe('DEFAULT_SEARCH', () => {
  it('has a non-empty query', () => expect(DEFAULT_SEARCH.query.length).toBeGreaterThan(0))
  it('defaults to "all" location', () => expect(DEFAULT_SEARCH.location).toBe('all'))
})

describe('buildFeeds', () => {
  it('returns arbeitnow + jobicy for location=all', () => {
    const feeds = buildFeeds({ query: 'Data Scientist', location: 'all' })
    const sources = feeds.map((f) => f.source)
    expect(sources).toContain('arbeitnow')
    expect(sources).toContain('jobicy')
  })

  it('skips arbeitnow for location=remote', () => {
    const feeds = buildFeeds({ query: 'ML Engineer', location: 'remote' })
    expect(feeds.every((f) => f.source !== 'arbeitnow')).toBe(true)
    expect(feeds.some((f) => f.source === 'jobicy')).toBe(true)
  })

  it('includes geo param in jobicy URL for location=ch', () => {
    const feeds = buildFeeds({ query: 'Data Engineer', location: 'ch' })
    const jobicy = feeds.find((f) => f.source === 'jobicy')
    expect(jobicy?.url).toContain('geo=switzerland')
  })

  it('includes geo param for location=de', () => {
    const feeds = buildFeeds({ query: 'Analyst', location: 'de' })
    const jobicy = feeds.find((f) => f.source === 'jobicy')
    expect(jobicy?.url).toContain('geo=germany')
  })

  it('passes locationFilter to arbeitnow config', () => {
    const feeds = buildFeeds({ query: 'Engineer', location: 'ch' })
    const arbeitnow = feeds.find((f) => f.source === 'arbeitnow')
    expect(arbeitnow?.locationFilter).toBe('ch')
  })

  it('URL-encodes the query', () => {
    const feeds = buildFeeds({ query: 'Machine Learning', location: 'all' })
    const arbeitnow = feeds.find((f) => f.source === 'arbeitnow')
    expect(arbeitnow?.url).toContain('Machine%20Learning')
  })

  it('uses fallback query when query is empty', () => {
    const feeds = buildFeeds({ query: '', location: 'all' })
    const arbeitnow = feeds.find((f) => f.source === 'arbeitnow')
    expect(arbeitnow?.url).toContain('data%20scientist')
  })

  it('returns at least one feed for every location option', () => {
    for (const loc of ['all', 'ch', 'de', 'at', 'remote'] as const) {
      const feeds = buildFeeds({ query: 'Engineer', location: loc })
      expect(feeds.length).toBeGreaterThan(0)
    }
  })
})
