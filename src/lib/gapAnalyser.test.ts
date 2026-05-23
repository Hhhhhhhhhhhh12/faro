import { describe, it, expect } from 'vitest'
import { computeGap } from './gapAnalyser'
import type { Job } from '../types'

function makeJob(requiredSkills: string[]): Job {
  return {
    id: Math.random().toString(36),
    title: 'Engineer',
    company: 'Corp',
    location: '',
    url: 'https://example.com',
    publishedAt: '',
    source: 'arbeitnow',
    rawDescription: '',
    requiredSkills,
    matchScore: 0,
    matchedSkills: [],
  }
}

describe('computeGap', () => {
  it('returns empty array when jobs list is empty', () => {
    expect(computeGap([], ['python'])).toEqual([])
  })

  it('excludes skills the user already has', () => {
    const jobs = [makeJob(['python', 'spark'])]
    const gap = computeGap(jobs, ['python'])
    expect(gap.map((g) => g.skill)).not.toContain('python')
    expect(gap.map((g) => g.skill)).toContain('spark')
  })

  it('counts frequency across multiple jobs', () => {
    const jobs = [
      makeJob(['spark', 'sql']),
      makeJob(['spark']),
      makeJob(['sql']),
    ]
    const gap = computeGap(jobs, [])
    const sparkItem = gap.find((g) => g.skill === 'spark')
    const sqlItem = gap.find((g) => g.skill === 'sql')
    expect(sparkItem?.frequency).toBe(2)
    expect(sqlItem?.frequency).toBe(2)
  })

  it('sorts by frequency descending', () => {
    const jobs = [
      makeJob(['spark', 'sql', 'kafka']),
      makeJob(['spark', 'sql']),
      makeJob(['spark']),
    ]
    const gap = computeGap(jobs, [])
    expect(gap[0].skill).toBe('spark')
    expect(gap[0].frequency).toBe(3)
  })

  it('marks all items as missingFromProfile', () => {
    const gap = computeGap([makeJob(['python'])], [])
    expect(gap[0].missingFromProfile).toBe(true)
  })

  it('attaches training info to each item', () => {
    const gap = computeGap([makeJob(['python'])], [])
    expect(gap[0].training).toBeDefined()
    expect(typeof gap[0].training.courseraUrl).toBe('string')
  })

  it('returns empty array when user already has all skills', () => {
    const jobs = [makeJob(['python', 'sql'])]
    expect(computeGap(jobs, ['python', 'sql'])).toEqual([])
  })
})
