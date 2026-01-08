import { useState, useEffect, useCallback } from 'react'

export interface RecentSearch {
  query: string
  timestamp: number
  topResultCode?: string
  topResultDescription?: string
}

const STORAGE_KEY = 'hs-code-recent-searches'
const MAX_RECENT = 10

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Failed to load recent searches:', err)
    }
  }, [])

  // Save to localStorage whenever recentSearches changes
  const saveToStorage = useCallback((searches: RecentSearch[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches))
    } catch (err) {
      console.error('Failed to save recent searches:', err)
    }
  }, [])

  const addSearch = useCallback((query: string, topResultCode?: string, topResultDescription?: string) => {
    if (!query.trim()) return

    setRecentSearches(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(s => s.query.toLowerCase() !== query.toLowerCase())

      // Add new search at the beginning
      const newSearch: RecentSearch = {
        query: query.trim(),
        timestamp: Date.now(),
        topResultCode,
        topResultDescription
      }

      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT)
      saveToStorage(updated)
      return updated
    })
  }, [saveToStorage])

  const removeSearch = useCallback((query: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s.query !== query)
      saveToStorage(updated)
      return updated
    })
  }, [saveToStorage])

  const clearAll = useCallback(() => {
    setRecentSearches([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearAll
  }
}
