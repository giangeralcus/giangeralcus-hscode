import { Clock, X, Trash2 } from 'lucide-react'
import type { RecentSearch } from '../hooks/useRecentSearches'
import { cn } from '../lib/utils'

interface RecentSearchesProps {
  searches: RecentSearch[]
  onSelect: (query: string) => void
  onRemove: (query: string) => void
  onClearAll: () => void
}

export function RecentSearches({ searches, onSelect, onRemove, onClearAll }: RecentSearchesProps) {
  if (searches.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Clock className="w-3.5 h-3.5" />
          <span>Recent</span>
        </div>
        <button
          onClick={onClearAll}
          className="text-xs text-white/30 hover:text-white/50 transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      <div className="space-y-1">
        {searches.map((search) => (
          <div
            key={search.query + search.timestamp}
            onClick={() => onSelect(search.query)}
            className={cn(
              "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all",
              "hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                {search.query}
              </span>
              {search.topResultCode && (
                <span className="text-xs font-mono text-white/30">
                  {search.topResultCode}
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(search.query)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
