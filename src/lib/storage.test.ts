import { describe, it, expect, beforeEach } from 'vitest'
import { loadStorage, saveStorage, clearStorage, isCacheStale } from './storage'

// Minimal localStorage mock for Node environment
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

beforeEach(() => localStorageMock.clear())

describe('loadStorage', () => {
  it('returns defaults when nothing is stored', () => {
    const data = loadStorage()
    expect(data.profile).toBeNull()
    expect(data.jobs).toEqual([])
    expect(data.jobsFetchedAt).toBeNull()
  })

  it('merges stored data with defaults', () => {
    localStorageMock.setItem('job-radar-v1', JSON.stringify({ jobsFetchedAt: 12345 }))
    const data = loadStorage()
    expect(data.jobsFetchedAt).toBe(12345)
    expect(data.jobs).toEqual([]) // default still applied
  })

  it('returns defaults on malformed JSON', () => {
    localStorageMock.setItem('job-radar-v1', 'not-json{{')
    const data = loadStorage()
    expect(data.jobs).toEqual([])
  })
})

describe('saveStorage', () => {
  it('persists partial data', () => {
    saveStorage({ jobsFetchedAt: 99999 })
    const data = loadStorage()
    expect(data.jobsFetchedAt).toBe(99999)
  })

  it('strips rawCvText from profile before saving', () => {
    saveStorage({
      profile: {
        id: 'singleton',
        skills: ['python'],
        rawCvText: 'Mein Lebenslauf…',
        updatedAt: 0,
      },
    })
    const raw = JSON.parse(localStorageMock.getItem('job-radar-v1')!)
    expect(raw.profile.rawCvText).toBeUndefined()
    expect(raw.profile.skills).toEqual(['python'])
  })

  it('does not overwrite existing data not included in partial save', () => {
    saveStorage({ jobsFetchedAt: 111 })
    saveStorage({ jobs: [] }) // second save — should keep jobsFetchedAt
    expect(loadStorage().jobsFetchedAt).toBe(111)
  })
})

describe('clearStorage', () => {
  it('removes all stored data', () => {
    saveStorage({ jobsFetchedAt: 42 })
    clearStorage()
    expect(loadStorage().jobsFetchedAt).toBeNull()
  })
})

describe('isCacheStale', () => {
  it('returns true when jobsFetchedAt is null', () => {
    expect(isCacheStale(null)).toBe(true)
  })

  it('returns false when timestamp is recent', () => {
    expect(isCacheStale(Date.now() - 60_000)).toBe(false) // 1 min ago
  })

  it('returns true when timestamp is older than TTL', () => {
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000
    expect(isCacheStale(threeHoursAgo)).toBe(true)
  })

  it('respects custom TTL', () => {
    const tenSecondsAgo = Date.now() - 10_000
    expect(isCacheStale(tenSecondsAgo, 5_000)).toBe(true)
    expect(isCacheStale(tenSecondsAgo, 60_000)).toBe(false)
  })
})
