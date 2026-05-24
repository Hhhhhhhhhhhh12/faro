import { useState, useCallback, useRef, useEffect } from 'react'
import type { Job, FeedConfig, SearchParams } from '../types'
import { loadStorage, saveStorage, isCacheStale } from '../lib/storage'
import { fetchFeed } from '../lib/rssClient'
import { parseJobFromRss } from '../lib/jobParser'
import { rescoreAll } from '../lib/scorer'
import { buildFeeds } from '../constants/feedUrls'

export interface FeedStatus {
  name: string
  status: 'idle' | 'loading' | 'ok' | 'error'
  error?: string
}

const MAX_JOBS = 20

function deduplicateJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>()
  return jobs.filter((j) => {
    if (seen.has(j.id)) return false
    seen.add(j.id)
    return true
  })
}

export function useJobs(userSkills: string[], searchParams: SearchParams) {
  const stored = loadStorage()
  const feeds = buildFeeds(searchParams)

  const [jobs, setJobs] = useState<Job[]>(() => rescoreAll(stored.jobs, userSkills))
  const [feedStatuses, setFeedStatuses] = useState<FeedStatus[]>(
    feeds.map((f) => ({ name: f.name, status: 'idle' }))
  )
  const [fetching, setFetching] = useState(false)
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(stored.jobsFetchedAt)

  const abortRef = useRef<AbortController | null>(null)

  const updateFeedStatus = useCallback((index: number, update: Partial<FeedStatus>) => {
    setFeedStatuses((prev) => prev.map((s, i) => (i === index ? { ...s, ...update } : s)))
  }, [])

  const fetchAllFeeds = useCallback(
    async (currentFeeds: FeedConfig[], skills: string[]) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setFetching(true)
      setFeedStatuses(currentFeeds.map((f) => ({ name: f.name, status: 'loading' })))

      const results: Job[][] = new Array(currentFeeds.length).fill([])

      await Promise.allSettled(
        currentFeeds.map(async (feed, i) => {
          try {
            const items = await fetchFeed(feed, controller.signal)
            results[i] = items.map((item) => parseJobFromRss(item, feed.source, skills))
            updateFeedStatus(i, { status: 'ok' })
          } catch (err) {
            if ((err as Error).name === 'AbortError') return
            updateFeedStatus(i, {
              status: 'error',
              error: err instanceof Error ? err.message : 'Netzwerkfehler',
            })
          }
        })
      )

      if (controller.signal.aborted) return

      const allJobs = results.flat()
      const unique = deduplicateJobs(allJobs)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, MAX_JOBS)

      const now = Date.now()
      setJobs(unique)
      setLastFetchedAt(now)
      saveStorage({ jobs: unique, jobsFetchedAt: now })
      setFetching(false)
    },
    [updateFeedStatus]
  )

  const refresh = useCallback((params?: SearchParams) => {
    const currentFeeds = buildFeeds(params ?? searchParams)
    setFeedStatuses(currentFeeds.map((f) => ({ name: f.name, status: 'loading' })))
    fetchAllFeeds(currentFeeds, userSkills)
  }, [fetchAllFeeds, searchParams, userSkills])

  const loadOrFetch = useCallback(() => {
    if (isCacheStale(lastFetchedAt)) refresh()
  }, [lastFetchedAt, refresh])

  useEffect(() => () => { abortRef.current?.abort() }, [])

  return { jobs, feedStatuses, fetching, lastFetchedAt, refresh, loadOrFetch }
}
