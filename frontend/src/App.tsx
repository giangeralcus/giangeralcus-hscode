import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import './index.css'
import { HSCodeSearch } from './components/HSCodeSearch'
import { SearchResults } from './components/SearchResults'
import { CodeDetail } from './components/CodeDetail'
import { RecentSearches } from './components/RecentSearches'
import { useHSSearch, type HSCodeResult } from './hooks/useHSSearch'
import { useRecentSearches } from './hooks/useRecentSearches'

function App() {
  const [query, setQuery] = useState('')
  const [selectedCode, setSelectedCode] = useState<HSCodeResult | null>(null)

  const { results, isLoading, error, search, clearResults } = useHSSearch()
  const { recentSearches, addSearch, removeSearch, clearAll } = useRecentSearches()

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    search(value)
  }, [search])

  const handleClear = useCallback(() => {
    setQuery('')
    clearResults()
  }, [clearResults])

  const handleSelectCode = useCallback((code: HSCodeResult) => {
    setSelectedCode(code)
    // Add to recent searches
    addSearch(query, code.code, code.description_id.slice(0, 50))
  }, [addSearch, query])

  const handleRecentSearch = useCallback((recentQuery: string) => {
    setQuery(recentQuery)
    search(recentQuery)
  }, [search])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">HS Code Indonesia</h1>
              <p className="text-xs text-gray-500">BTKI 2022 - Pencarian Kode HS</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <HSCodeSearch
            value={query}
            onChange={handleSearch}
            onClear={handleClear}
            isLoading={isLoading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Recent Searches (show when no query) */}
        {!query && recentSearches.length > 0 && (
          <div className="mb-6">
            <RecentSearches
              searches={recentSearches}
              onSelect={handleRecentSearch}
              onRemove={removeSearch}
              onClearAll={clearAll}
            />
          </div>
        )}

        {/* Results */}
        {query && (
          <SearchResults
            results={results}
            query={query}
            onSelectCode={handleSelectCode}
          />
        )}

        {/* Empty State (no query, no recent) */}
        {!query && recentSearches.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Mulai mencari nama barang</p>
            <p className="text-sm mt-2">Contoh: sepatu, laptop, kain tekstil</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-3">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs text-gray-400 text-center">
            HS Code Indonesia by{' '}
            <a href="https://github.com/giangeralcus" className="text-blue-600 hover:underline">
              Gian Geralcus
            </a>
            {' '}| Licensed Customs Broker
          </p>
        </div>
      </footer>

      {/* Code Detail Modal */}
      {selectedCode && (
        <CodeDetail
          code={selectedCode}
          onClose={() => setSelectedCode(null)}
        />
      )}
    </div>
  )
}

export default App
