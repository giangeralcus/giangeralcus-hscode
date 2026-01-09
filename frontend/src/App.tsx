import { useState, useCallback } from 'react'
import { History, Search, Sparkles, Github, Linkedin } from 'lucide-react'
import './index.css'
import { HSCodeSearch } from './components/HSCodeSearch'
import { SearchResults } from './components/SearchResults'
import { CodeDetail } from './components/CodeDetail'
import { RecentSearches } from './components/RecentSearches'
import { useHSSearch, type HSCodeResult } from './hooks/useHSSearch'
import { useRecentSearches } from './hooks/useRecentSearches'
import { cn } from './lib/utils'

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

  const quickSearchItems = [
    { label: 'coffee', icon: '☕' },
    { label: 'footwear', icon: '👟' },
    { label: 'laptop', icon: '💻' },
    { label: 'textile', icon: '🧵' },
  ]

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] right-[-15%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px]" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />

        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
      </div>

      {/* Main Content */}
      <main className="relative flex-1 w-full flex items-center justify-center">
        <div className={cn(
          "w-full max-w-2xl mx-auto px-6 py-12 pb-28",
          "transition-all duration-500 ease-out",
          query ? "pt-8" : "pt-12"
        )}>
          {/* Hero Section */}
          <div className="w-full">
            {/* Brand Header */}
            <div className={cn(
              "text-center mb-8 transition-all duration-500",
              query ? "mb-6" : "mb-10"
            )}>
              {/* Logo Mark */}
              {!query && (
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-white/10">
                  <Search className="w-7 h-7 text-cyan-400" />
                </div>
              )}

              {/* Title */}
              <h1 className={cn(
                "font-bold tracking-tight transition-all duration-500",
                query ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl"
              )}>
                <span className="bg-gradient-to-r from-red-400 to-rose-500 bg-clip-text text-transparent">
                  Gian
                </span>{' '}
                <span className="text-white">Geralcus</span>
              </h1>
              <h2 className={cn(
                "font-bold tracking-tight transition-all duration-500",
                query ? "text-2xl sm:text-3xl mt-1" : "text-4xl sm:text-5xl mt-2"
              )}>
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  HS Code
                </span>
              </h2>

              {/* Tagline */}
              {!query && (
                <p className="text-white/50 text-sm mt-4 max-w-md mx-auto leading-relaxed text-center">
                  Temukan klasifikasi tarif untuk barang impor dan ekspor Indonesia dengan cepat dan akurat
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

            {/* Quick Search Chips */}
            {!query && (
              <div className="w-full mt-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-xs text-white/30 font-medium uppercase tracking-wider">
                    Pencarian Cepat
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {quickSearchItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleSearch(item.label)}
                      className={cn(
                        "group flex items-center gap-2 px-4 py-2",
                        "text-sm text-white/60 font-medium",
                        "bg-white/[0.03] backdrop-blur-sm",
                        "border border-white/10 rounded-xl",
                        "hover:bg-white/[0.08] hover:border-cyan-500/30 hover:text-white",
                        "transition-all duration-300",
                        "hover:shadow-lg hover:shadow-cyan-500/5"
                      )}
                    >
                      <span className="text-base opacity-70 group-hover:opacity-100 transition-opacity">
                        {item.icon}
                      </span>
                      <span className="capitalize">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className={cn(
              "w-full mt-6 p-4 rounded-2xl",
              "bg-rose-500/10 border border-rose-500/20",
              "backdrop-blur-sm"
            )}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-rose-400 text-lg">!</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-rose-400">Terjadi Kesalahan</p>
                  <p className="text-xs text-rose-400/70 mt-1">{error}</p>
                </div>
              </div>
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

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="w-full mt-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <History className="w-4 h-4 text-white/30" />
                <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">
                  Pencarian Terakhir
                </span>
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
      <footer className={cn(
        "fixed bottom-0 left-0 right-0 w-full z-20",
        "py-4 px-6",
        "bg-slate-950/80 backdrop-blur-xl",
        "border-t border-white/5"
      )}>
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Copyright */}
            <p className="text-xs text-white/40 text-center sm:text-left">
              © 2026{' '}
              <a
                href="https://github.com/giangeralcus"
                className="text-white/60 hover:text-cyan-400 transition-colors font-medium"
              >
                Gian Geralcus
              </a>
              <span className="mx-2 text-white/20">·</span>
              <span className="text-white/30">Licensed Customs Broker</span>
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-1">
              <a
                href="https://github.com/giangeralcus"
                className={cn(
                  "p-2 rounded-lg",
                  "text-white/30 hover:text-white hover:bg-white/10",
                  "transition-all duration-200"
                )}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/in/giangeralcus"
                className={cn(
                  "p-2 rounded-lg",
                  "text-white/30 hover:text-white hover:bg-white/10",
                  "transition-all duration-200"
                )}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
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
