import { X, Trash2 } from 'lucide-react'
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
    <div className="space-y-2">
      {searches.map((search) => (
        <div
          key={search.query + search.timestamp}
          onClick={() => onSelect(search.query)}
          className={cn(
            "group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer",
            "bg-white/[0.03] border border-white/5",
            "hover:bg-white/[0.06] hover:border-white/10 transition-all"
          )}
        >
          <div className="flex items-center gap-3">
            <span className="text-white/70 group-hover:text-white transition-colors">
              {search.query}
            </span>
            {search.topResultCode && (
              <span className="text-xs font-mono text-cyan-400/60 bg-cyan-400/10 px-2 py-0.5 rounded">
                {search.topResultCode}
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove(search.query)
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <button
        onClick={onClearAll}
        className="flex items-center gap-1.5 text-xs text-white/30 hover:text-red-400 transition-colors mt-3 px-1"
      >
        <Trash2 className="w-3 h-3" />
        Hapus semua
      </button>
    </div>
  )
}
