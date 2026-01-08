import { useState, useCallback } from 'react'
import { Search, Box } from 'lucide-react'
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
    <div className="min-h-screen bg-[#08080c] text-white relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <Box className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-lg font-medium tracking-tight">
                  HS Code <span className="text-cyan-400">Indonesia</span>
                </h1>
                <p className="text-xs text-white/40">BTKI 2022</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span>14,999 kode aktif</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-3xl mx-auto px-6 py-12">
        {/* Hero Text */}
        {!query && (
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
              Cari <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Kode HS</span>
            </h2>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              Temukan klasifikasi tarif untuk barang impor dan ekspor Indonesia
            </p>
          </div>
        )}

        {/* Search */}
        <HSCodeSearch
          value={query}
          onChange={handleSearch}
          onClear={handleClear}
          isLoading={isLoading}
        />

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Recent Searches */}
        {!query && recentSearches.length > 0 && (
          <div className="mt-10">
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
          <div className="mt-8">
            <SearchResults
              results={results}
              query={query}
              isLoading={isLoading}
              onSelectCode={handleSelectCode}
            />
          </div>
        )}

        {/* Empty State */}
        {!query && recentSearches.length === 0 && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mb-5">
              <Search className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-white/40 text-sm mb-6">
              Ketik nama produk atau kode HS
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['coffee', 'footwear', 'laptop', 'textile'].map((item) => (
                <button
                  key={item}
                  onClick={() => handleSearch(item)}
                  className="px-4 py-2 text-sm text-white/60 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-all"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center border-t border-white/5 bg-[#08080c]/80 backdrop-blur-sm">
        <p className="text-xs text-white/30">
          Built by{' '}
          <a href="https://github.com/giangeralcus" className="text-white/50 hover:text-cyan-400 transition-colors">
            Gian Geralcus
          </a>
          <span className="mx-2 text-white/20">|</span>
          Licensed Customs Broker
        </p>
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
