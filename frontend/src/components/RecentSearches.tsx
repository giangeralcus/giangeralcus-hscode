import { Clock, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
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
    <div className="bg-gray-50 rounded-xl p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm font-medium text-gray-600 hover:text-gray-800"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Pencarian Terakhir</span>
          <span className="text-gray-400">({searches.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <>
          <div className="mt-3 space-y-1">
            {searches.map((search) => (
              <div
                key={search.query + search.timestamp}
                className={cn(
                  "group flex items-center justify-between px-3 py-2 rounded-lg",
                  "hover:bg-white cursor-pointer transition-colors"
                )}
                onClick={() => onSelect(search.query)}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-gray-700">{search.query}</span>
                  {search.topResultCode && (
                    <span className="ml-2 text-xs text-gray-400 font-mono">
                      ({search.topResultCode})
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(search.query)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-all"
                  title="Hapus pencarian"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={onClearAll}
            className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Hapus Semua
          </button>
        </>
      )}
    </div>
  )
}
