import type { Job, SkillGapItem } from '../types'
import { getTraining } from '../constants/trainingMap'

export function computeGap(jobs: Job[], userSkills: string[]): SkillGapItem[] {
  const userSkillSet = new Set(userSkills)
  const freq: Record<string, number> = {}

  for (const job of jobs) {
    for (const skill of job.requiredSkills) {
      if (!userSkillSet.has(skill)) {
        freq[skill] = (freq[skill] ?? 0) + 1
      }
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([skill, frequency]) => ({
      skill,
      frequency,
      training: getTraining(skill),
    }))
}
