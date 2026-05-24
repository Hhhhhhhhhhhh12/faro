import type { FeedConfig, LocationFilter, SearchParams } from '../types'

export const DEFAULT_SEARCH: SearchParams = {
  query: 'Data Scientist',
  location: 'all',
}

const GEO_MAP: Partial<Record<LocationFilter, string>> = {
  ch: 'switzerland',
  de: 'germany',
  at: 'austria',
}

export function buildFeeds(params: SearchParams): FeedConfig[] {
  const q = encodeURIComponent(params.query || 'data scientist')
  const feeds: FeedConfig[] = []

  // --- Arbeitnow (DACH + some remote) ---
  // Always include; location filtering applied client-side in rssClient.ts
  if (params.location !== 'remote') {
    feeds.push({
      name: `Arbeitnow — ${params.query}`,
      source: 'arbeitnow',
      url: `https://www.arbeitnow.com/api/job-board-api?search=${q}`,
      type: 'json-arbeitnow',
      locationFilter: params.location,
    })
  }

  // --- Jobicy (Remote only) ---
  const geo = GEO_MAP[params.location]
  if (params.location === 'remote' || params.location === 'all') {
    // All remote jobs globally
    feeds.push({
      name: `Jobicy Remote — ${params.query}`,
      source: 'jobicy',
      url: `https://jobicy.com/api/v2/remote-jobs?count=20&industry=data-science`,
      type: 'json-jobicy',
    })
  } else if (geo) {
    // Location-specific remote jobs
    feeds.push({
      name: `Jobicy Remote ${params.location.toUpperCase()} — ${params.query}`,
      source: 'jobicy',
      url: `https://jobicy.com/api/v2/remote-jobs?count=20&industry=data-science&geo=${geo}`,
      type: 'json-jobicy',
    })
  }

  return feeds
}

export const SOURCE_LABELS: Record<string, string> = {
  jobsch: 'jobs.ch',
  heise: 'heise jobs',
  stepstone: 'Stepstone',
  linkedin: 'LinkedIn',
  arbeitnow: 'Arbeitnow',
  jobicy: 'Jobicy Remote',
  unknown: 'Unbekannt',
}

export const SOURCE_COLORS: Record<string, string> = {
  jobsch: '#0066cc',
  heise: '#c0003c',
  stepstone: '#f47920',
  linkedin: '#0077b5',
  arbeitnow: '#6366f1',
  jobicy: '#059669',
  unknown: '#888',
}

export const LOCATION_OPTIONS: { value: LocationFilter; label: string; flag: string }[] = [
  { value: 'all',    label: 'Alle Regionen', flag: '🌍' },
  { value: 'ch',     label: 'Schweiz',       flag: '🇨🇭' },
  { value: 'de',     label: 'Deutschland',   flag: '🇩🇪' },
  { value: 'at',     label: 'Österreich',    flag: '🇦🇹' },
  { value: 'remote', label: 'Remote',        flag: '💻' },
]
