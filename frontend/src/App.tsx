import { useState, useCallback } from 'react'
import { History } from 'lucide-react'
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
    addSearch(query, code.code, code.description_id.slice(0, 50))
  }, [addSearch, query])

  const handleRecentSearch = useCallback((recentQuery: string) => {
    setQuery(recentQuery)
    search(recentQuery)
  }, [search])

  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] text-white flex flex-col">
      {/* Background Gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>


      {/* Main Content */}
      <main className="relative flex-1 w-full flex items-center justify-center">
        <div className="w-full max-w-2xl mx-auto px-6 py-12 pb-24">
          {/* Search Section */}
          <div className="w-full">
            {/* Title - Always visible */}
            <div className="text-center mb-6">
              <h1 className={`font-bold mb-2 ${query ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'} transition-all`}>
                <span className="text-red-500">Gian</span>{' '}
                <span className="text-white">Geralcus</span>
              </h1>
              <h2 className={`font-bold mb-2 ${query ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'} transition-all`}>
                <span className="text-cyan-400">HS Code</span>
              </h2>
              {!query && (
                <p className="text-white/50 text-sm">
                  Temukan klasifikasi tarif untuk barang impor dan ekspor Indonesia
                </p>
              )}
            </div>

            {/* Search Input */}
            <div className="w-full">
              <HSCodeSearch
                value={query}
                onChange={handleSearch}
                onClear={handleClear}
                isLoading={isLoading}
              />
            </div>

            {/* Quick Search - Only when no query */}
            {!query && (
              <div className="w-full flex flex-wrap items-center justify-center gap-2 mt-4">
                {['coffee', 'footwear', 'laptop', 'textile'].map((item) => (
                  <button
                    key={item}
                    onClick={() => handleSearch(item)}
                    className="px-3 py-1.5 text-sm text-white/50 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white/70 transition-all"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="w-full mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          {query && (
            <div className="w-full mt-8">
              <SearchResults
                results={results}
                query={query}
                isLoading={isLoading}
                onSelectCode={handleSelectCode}
              />
            </div>
          )}

          {/* Recent Searches - Only when no query and has history */}
          {!query && recentSearches.length > 0 && (
            <div className="w-full mt-10">
              <div className="flex items-center gap-2 mb-4 text-sm text-white/40">
                <History className="w-4 h-4" />
                <span>Pencarian Terakhir</span>
              </div>
              <RecentSearches
                searches={recentSearches}
                onSelect={handleRecentSearch}
                onRemove={removeSearch}
                onClearAll={clearAll}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 w-full py-4 bg-[#0a0a0f]/90 backdrop-blur-sm border-t border-white/5 z-20">
        <div className="flex flex-col items-center justify-center gap-1">
          <p className="text-xs text-white/30 text-center">
            © 2026{' '}
            <a href="https://github.com/giangeralcus" className="text-white/50 hover:text-cyan-400 transition-colors">
              Gian Geralcus
            </a>
            {' · '}Licensed Customs Broker
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/giangeralcus"
              className="text-xs text-white/20 hover:text-cyan-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <span className="text-white/10">·</span>
            <a
              href="https://linkedin.com/in/giangeralcus"
              className="text-xs text-white/20 hover:text-cyan-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>

      {/* Modal */}
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
