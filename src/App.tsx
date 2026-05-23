import { useEffect, useRef, useState } from 'react'
import { useProfile } from './hooks/useProfile'
import { useJobs } from './hooks/useJobs'
import { useSkillGap } from './hooks/useSkillGap'
import { Shell } from './components/layout/Shell'
import { loadStorage, saveStorage } from './lib/storage'
import { DEFAULT_SEARCH } from './constants/feedUrls'
import type { SearchParams } from './types'

function App() {
  const { profile, loading: pdfLoading, error: pdfError, loadFromPdf, addSkill, removeSkill } = useProfile()
  const userSkills = profile?.skills ?? []

  const [searchParams, setSearchParams] = useState<SearchParams>(() => {
    const stored = loadStorage()
    return stored.searchParams ?? DEFAULT_SEARCH
  })

  const { jobs, feedStatuses, fetching, lastFetchedAt, refresh, loadOrFetch } = useJobs(userSkills, searchParams)
  const gapItems = useSkillGap(jobs, userSkills)

  const loadOrFetchRef = useRef(loadOrFetch)
  loadOrFetchRef.current = loadOrFetch
  useEffect(() => {
    loadOrFetchRef.current()
  }, []) // intentionally empty — mount-only trigger via stable ref

  function handleSearch(params: SearchParams) {
    setSearchParams(params)
    saveStorage({ searchParams: params })
    refresh(params)
  }

  return (
    <Shell
      skills={userSkills}
      pdfLoading={pdfLoading}
      pdfError={pdfError}
      onPdfFile={loadFromPdf}
      onAddSkill={addSkill}
      onRemoveSkill={removeSkill}
      jobs={jobs}
      feedStatuses={feedStatuses}
      fetching={fetching}
      lastFetchedAt={lastFetchedAt}
      onRefresh={refresh}
      gapItems={gapItems}
      searchParams={searchParams}
      onSearch={handleSearch}
    />
  )
}

export default App
