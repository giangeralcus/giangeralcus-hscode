import { Clock, X, Trash2, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import type { RecentSearch } from '../hooks/useRecentSearches'
import { cn } from '../lib/utils'

interface RecentSearchesProps {
  searches: RecentSearch[]
  onSelect: (query: string) => void
  onRemove: (query: string) => void
  onClearAll: () => void
}

export function RecentSearches({ searches, onSelect, onRemove, onClearAll }: RecentSearchesProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (searches.length === 0) {
    return null
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4 shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Clock className="h-3.5 w-3.5 text-gray-500" />
          </div>
          <span>Pencarian Terakhir</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {searches.length}
          </span>
        </div>
        <div className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <>
          <div className="mt-3 space-y-1">
            {searches.map((search, index) => (
              <div
                key={search.query + search.timestamp}
                className={cn(
                  "group flex items-center justify-between px-3 py-2.5 rounded-xl",
                  "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50",
                  "cursor-pointer transition-all duration-200"
                )}
                onClick={() => onSelect(search.query)}
                style={{
                  animationDelay: `${index * 30}ms`,
                  animation: 'fadeIn 0.2s ease-out forwards'
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-700 group-hover:text-gray-900 font-medium">
                      {search.query}
                    </span>
                    {search.topResultCode && (
                      <span className="ml-2 text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded group-hover:bg-white/50">
                        {search.topResultCode}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(search.query)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-red-500 transition-all"
                  title="Hapus pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
              Hapus Semua
            </button>
          </div>
        </>
      )}
    </div>
  )
}
