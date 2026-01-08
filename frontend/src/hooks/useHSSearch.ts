import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export interface HSCodeResult {
  code: string
  code_formatted: string
  description_id: string
  description_en: string | null
  chapter: string
  similarity: number
}

interface UseHSSearchReturn {
  results: HSCodeResult[]
  isLoading: boolean
  error: string | null
  search: (query: string) => void
  clearResults: () => void
}

export function useHSSearch(): UseHSSearchReturn {
  const [results, setResults] = useState<HSCodeResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Try using the search function first
      const { data, error: searchError } = await supabase
        .rpc('search_hs_codes', { search_term: query, limit_count: 50 })

      if (searchError) {
        // Fallback to direct query if function doesn't exist
        // Sanitize query to prevent SQL injection
        const sanitizedQuery = query.replace(/[%_\\]/g, '\\$&')

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('hs_codes')
          .select('code, code_formatted, description_id, description_en, chapter')
          .or(`code.ilike.%${sanitizedQuery}%,description_id.ilike.%${sanitizedQuery}%,description_en.ilike.%${sanitizedQuery}%`)
          .limit(50)

        if (fallbackError) throw fallbackError

        setResults((fallbackData || []).map(item => ({
          ...item,
          similarity: 0
        })))
      } else {
        setResults(data || [])
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mencari')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const search = useCallback((query: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(query)
    }, 300)
  }, [performSearch])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return { results, isLoading, error, search, clearResults }
}
