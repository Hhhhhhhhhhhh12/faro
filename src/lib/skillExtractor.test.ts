import { describe, it, expect } from 'vitest'
import { extractSkills } from './skillExtractor'
import type { SkillEntry } from '../types'

// Minimal test dictionary — isolated from the real dictionary so tests stay fast
const TEST_DICT: SkillEntry[] = [
  { canonical: 'python', aliases: ['python', 'py'], shortAlias: true },
  { canonical: 'sql', aliases: ['sql'], shortAlias: false },
  { canonical: 'spark', aliases: ['apache spark', 'spark'], shortAlias: false },
  { canonical: 'pytorch', aliases: ['pytorch'], shortAlias: false },
  { canonical: 'r', aliases: ['r'], shortAlias: true },
]

describe('extractSkills', () => {
  it('finds a simple skill in plain text', () => {
    const skills = extractSkills('We need Python and SQL knowledge', TEST_DICT)
    expect(skills).toContain('python')
    expect(skills).toContain('sql')
  })

  it('is case-insensitive', () => {
    expect(extractSkills('PYTHON developer', TEST_DICT)).toContain('python')
    expect(extractSkills('PyTorch experience required', TEST_DICT)).toContain('pytorch')
  })

  it('matches multi-word aliases', () => {
    const skills = extractSkills('Experience with Apache Spark required', TEST_DICT)
    expect(skills).toContain('spark')
  })

  it('does NOT match short alias "py" inside other words (word-boundary)', () => {
    // "epy" should not match "py" with \b boundary
    const skills = extractSkills('supply chain management', TEST_DICT)
    expect(skills).not.toContain('python')
  })

  it('does NOT match short alias "r" inside other words', () => {
    const skills = extractSkills('required proficiency', TEST_DICT)
    expect(skills).not.toContain('r')
  })

  it('returns empty array for text with no matching skills', () => {
    expect(extractSkills('Project management and communication skills', TEST_DICT)).toEqual([])
  })

  it('returns each skill only once even if matched multiple times', () => {
    const skills = extractSkills('Python, python, PYTHON', TEST_DICT)
    expect(skills.filter((s) => s === 'python').length).toBe(1)
  })

  it('uses SKILL_DICTIONARY by default (smoke test)', () => {
    const skills = extractSkills('Python developer with SQL experience')
    expect(skills).toContain('python')
    expect(skills).toContain('sql')
  })
})
