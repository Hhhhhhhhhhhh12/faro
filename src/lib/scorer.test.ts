import { describe, it, expect } from 'vitest'
import { rescoreJob, rescoreAll, scoreLabel, scoreColor } from './scorer'
import type { Job } from '../types'

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'test-1',
    title: 'Data Engineer',
    company: 'Acme',
    location: 'Zürich',
    url: 'https://example.com/job/1',
    publishedAt: '2024-01-01',
    source: 'arbeitnow',
    rawDescription: '',
    requiredSkills: [],
    matchScore: 0,
    matchedSkills: [],
    ...overrides,
  }
}

describe('rescoreJob', () => {
  it('returns score 0 when job has no required skills', () => {
    const job = makeJob({ requiredSkills: [] })
    const result = rescoreJob(job, ['python', 'sql'])
    expect(result.matchScore).toBe(0)
    expect(result.matchedSkills).toEqual([])
  })

  it('returns 100 when user has all required skills', () => {
    const job = makeJob({ requiredSkills: ['python', 'sql'] })
    const result = rescoreJob(job, ['python', 'sql', 'spark'])
    expect(result.matchScore).toBe(100)
    expect(result.matchedSkills).toEqual(['python', 'sql'])
  })

  it('returns 50 when user has half the required skills', () => {
    const job = makeJob({ requiredSkills: ['python', 'sql'] })
    const result = rescoreJob(job, ['python'])
    expect(result.matchScore).toBe(50)
    expect(result.matchedSkills).toEqual(['python'])
  })

  it('rounds score correctly (1/3 → 33)', () => {
    const job = makeJob({ requiredSkills: ['python', 'sql', 'spark'] })
    const result = rescoreJob(job, ['python'])
    expect(result.matchScore).toBe(33)
  })

  it('does not mutate original job', () => {
    const job = makeJob({ requiredSkills: ['python'], matchScore: 0 })
    rescoreJob(job, ['python'])
    expect(job.matchScore).toBe(0)
  })
})

describe('rescoreAll', () => {
  it('rescores every job in the array', () => {
    const jobs = [
      makeJob({ id: '1', requiredSkills: ['python'] }),
      makeJob({ id: '2', requiredSkills: ['java'] }),
    ]
    const result = rescoreAll(jobs, ['python'])
    expect(result[0].matchScore).toBe(100)
    expect(result[1].matchScore).toBe(0)
  })

  it('returns empty array for empty input', () => {
    expect(rescoreAll([], ['python'])).toEqual([])
  })
})

describe('scoreLabel', () => {
  it('labels 75+ as Sehr gut', () => expect(scoreLabel(75)).toBe('Sehr gut'))
  it('labels 50–74 as Gut', () => expect(scoreLabel(50)).toBe('Gut'))
  it('labels 25–49 as Teilweise', () => expect(scoreLabel(25)).toBe('Teilweise'))
  it('labels 0–24 as Gering', () => expect(scoreLabel(10)).toBe('Gering'))
})

describe('scoreColor', () => {
  it('returns green for high scores', () => expect(scoreColor(80)).toBe('#22c55e'))
  it('returns red for low scores', () => expect(scoreColor(5)).toBe('#ef4444'))
})
