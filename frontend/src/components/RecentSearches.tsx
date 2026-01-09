import { X, Trash2, Clock, Hash } from 'lucide-react'
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
            "group relative flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl cursor-pointer",
            "bg-slate-800/30 backdrop-blur-sm",
            "border border-white/5",
            "transition-all duration-300",
            "hover:bg-slate-800/50 hover:border-cyan-500/20",
            "hover:shadow-lg hover:shadow-cyan-500/5"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white/30 group-hover:text-cyan-400/70 transition-colors" />
            </div>
            <div className="min-w-0">
              <span className="block text-white/70 group-hover:text-white transition-colors font-medium truncate">
                {search.query}
              </span>
              {search.topResultDescription && (
                <span className="block text-xs text-white/30 truncate mt-0.5">
                  {search.topResultDescription}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {search.topResultCode && (
              <span className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg",
                "text-xs font-mono font-medium",
                "bg-cyan-500/10 text-cyan-400/80 border border-cyan-500/20"
              )}>
                <Hash className="w-3 h-3" />
                {search.topResultCode}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(search.query)
              }}
              className={cn(
                "p-1.5 rounded-lg",
                "opacity-0 group-hover:opacity-100",
                "text-white/30 hover:text-rose-400 hover:bg-rose-500/10",
                "transition-all duration-200"
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      <div className="pt-2">
        <button
          onClick={onClearAll}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            "text-xs font-medium",
            "text-white/30 hover:text-rose-400",
            "hover:bg-rose-500/10",
            "transition-all duration-200"
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Hapus Semua Riwayat
        </button>
      </div>
    </div>
  )
}
