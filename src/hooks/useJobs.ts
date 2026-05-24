import { useState, useCallback, useRef, useEffect } from 'react'
import type { Job, FeedConfig, SearchParams } from '../types'
import { loadStorage, saveStorage, isCacheStale } from '../lib/storage'
import { fetchFeed } from '../lib/rssClient'
import { parseJobFromRss } from '../lib/jobParser'
import { rescoreAll } from '../lib/scorer'
import { FEEDS } from '../constants/feedUrls'

function buildFeeds(params: SearchParams): FeedConfig[] {
  const query = params.query.trim() || 'data scientist'
  const q = encodeURIComponent(query)
  const arbeitnowFeed: FeedConfig = {
    name: `Arbeitnow — ${query}`,
    source: 'arbeitnow',
    url: `https://www.arbeitnow.com/api/job-board-api?search=${q}`,
    type: 'json-arbeitnow',
  }
  const jobicyFeeds = FEEDS.filter((f) => f.source === 'jobicy')
  if (params.location === 'de') return [arbeitnowFeed]
  if (params.location === 'remote') return jobicyFeeds
  return [arbeitnowFeed, ...jobicyFeeds]
}

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
  const [jobs, setJobs] = useState<Job[]>(() =>
    rescoreAll(stored.jobs, userSkills)
  )
  const [feedStatuses, setFeedStatuses] = useState<FeedStatus[]>(
    buildFeeds(searchParams).map((f) => ({ name: f.name, status: 'idle' }))
  )
  const [fetching, setFetching] = useState(false)
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(stored.jobsFetchedAt)

  // Track the current fetch so we can cancel it on unmount or re-trigger
  const abortRef = useRef<AbortController | null>(null)

  const updateFeedStatus = useCallback((index: number, update: Partial<FeedStatus>) => {
    setFeedStatuses((prev) => prev.map((s, i) => (i === index ? { ...s, ...update } : s)))
  }, [])

  const fetchAllFeeds = useCallback(
    async (feeds: FeedConfig[], skills: string[]) => {
      // Cancel any in-flight request from a previous call
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setFetching(true)
      setFeedStatuses(feeds.map((f) => ({ name: f.name, status: 'loading' })))

      // Collect results into a local array to avoid shared-state mutation across concurrent calls
      const results: Job[][] = new Array(feeds.length).fill([])

      await Promise.allSettled(
        feeds.map(async (feed, i) => {
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

      // If this fetch was aborted (component unmounted or new fetch started), discard results
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
    fetchAllFeeds(buildFeeds(params ?? searchParams), userSkills)
  }, [fetchAllFeeds, userSkills, searchParams])

  const loadOrFetch = useCallback(() => {
    if (isCacheStale(lastFetchedAt)) {
      refresh()
    }
  }, [lastFetchedAt, refresh])

  // Cancel any in-flight requests when the hook unmounts
  useEffect(() => () => { abortRef.current?.abort() }, [])

  return { jobs, feedStatuses, fetching, lastFetchedAt, refresh, loadOrFetch }
}
