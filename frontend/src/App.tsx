import { useState, useCallback } from 'react'
import { Search, Package, Sparkles } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl blur-sm opacity-75"></div>
                <div className="relative p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  HS Code Indonesia
                </h1>
                <p className="text-xs text-gray-500 font-medium">BTKI 2022 - Pencarian Kode HS</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="font-medium">14,999 Kode</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* Hero Section when no query */}
        {!query && (
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Cari Kode HS dengan Mudah
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Ketik nama barang atau kode HS untuk menemukan klasifikasi yang tepat
            </p>
          </div>
        )}

        {/* Search */}
        <div className="mb-8">
          <HSCodeSearch
            value={query}
            onChange={handleSearch}
            onClear={handleClear}
            isLoading={isLoading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-start gap-3">
            <div className="p-1 bg-red-100 rounded-lg">
              <Search className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="font-medium">Terjadi kesalahan</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
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
            isLoading={isLoading}
            onSelectCode={handleSelectCode}
          />
        )}

        {/* Empty State (no query, no recent) */}
        {!query && recentSearches.length === 0 && (
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-3xl blur-xl opacity-50"></div>
              <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100">
                <Search className="h-12 w-12 text-blue-500" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-700">Mulai Pencarian</p>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Ketik nama produk seperti "sepatu", "laptop", atau masukkan kode HS langsung
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['sepatu', 'laptop', 'tekstil', 'elektronik'].map((item) => (
                <button
                  key={item}
                  onClick={() => handleSearch(item)}
                  className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-full text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 shadow-sm"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200/50 py-3">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>Built by</span>
            <a href="https://github.com/giangeralcus" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
              Gian Geralcus
            </a>
            <span className="text-gray-400">|</span>
            <span>Licensed Customs Broker</span>
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
