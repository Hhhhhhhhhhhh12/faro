import { useState } from 'react'
import type { SearchParams, LocationFilter } from '../../types'
import { LOCATION_OPTIONS } from '../../constants/feedUrls'
import styles from './SearchBar.module.css'

interface Props {
  initialParams: SearchParams
  onSearch: (params: SearchParams) => void
  disabled?: boolean
}

export function SearchBar({ initialParams, onSearch, disabled }: Props) {
  const [query, setQuery] = useState(initialParams.query)
  const [location, setLocation] = useState<LocationFilter>(initialParams.location)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    onSearch({ query: trimmed, location })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} role="search">
      <div className={styles.inputWrap}>
        <span className={styles.inputIcon} aria-hidden="true">🔍</span>
        <input
          className={styles.input}
          type="search"
          placeholder="Jobtitel oder Suchbegriff …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          aria-label="Jobtitel oder Suchbegriff"
        />
      </div>

      <select
        className={styles.select}
        value={location}
        onChange={(e) => setLocation(e.target.value as LocationFilter)}
        disabled={disabled}
        aria-label="Region"
      >
        {LOCATION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.flag} {opt.label}
          </option>
        ))}
      </select>

      <button
        className={styles.button}
        type="submit"
        disabled={disabled || !query.trim()}
        aria-label="Jobs suchen"
      >
        {disabled ? <span className={styles.spinner} aria-hidden="true" /> : 'Suchen'}
      </button>
    </form>
  )
}
