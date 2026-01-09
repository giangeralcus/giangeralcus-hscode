import { Copy, Check, ArrowRight, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import type { HSCodeResult } from '../hooks/useHSSearch'
import { cn, copyToClipboard } from '../lib/utils'

interface SearchResultsProps {
  results: HSCodeResult[]
  query: string
  isLoading?: boolean
  onSelectCode: (code: HSCodeResult) => void
}

function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-3 flex-1">
          <div className="h-5 w-24 bg-white/10 rounded" />
          <div className="h-4 w-full bg-white/5 rounded" />
          <div className="h-4 w-2/3 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  )
}

export function SearchResults({ results, query, isLoading = false, onSelectCode }: SearchResultsProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopy = async (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const success = await copyToClipboard(code)
    if (success) {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-white/40 flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          Searching...
        </p>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (results.length === 0 && query.length >= 2) {
    return (
      <div className="text-center py-12">
        <p className="text-white/50">No results for "{query}"</p>
        <p className="text-sm text-white/30 mt-1">Try a different keyword</p>
      </div>
    )
  }

  if (results.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/40">
        <span className="text-white/60 font-medium">{results.length}</span> results
      </p>

      <div className="space-y-2">
        {results.map((result) => (
          <div
            key={result.code}
            onClick={() => onSelectCode(result)}
            className={cn(
              "group p-4 rounded-xl cursor-pointer transition-all duration-200",
              "bg-white/[0.03] border border-white/5",
              "hover:bg-white/[0.06] hover:border-white/10"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Code & Tariff */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-medium">
                      {result.code_formatted || result.code}
                    </span>
                    <button
                      onClick={(e) => handleCopy(result.code, e)}
                      className={cn(
                        "p-1 rounded transition-all",
                        "text-white/20 hover:text-white/60 hover:bg-white/10",
                        copiedCode === result.code && "text-emerald-400"
                      )}
                    >
                      {copiedCode === result.code ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {/* Badges */}
                  <div className="flex items-center gap-1.5">
                    {/* Lartas Badge */}
                    {result.has_lartas && (
                      <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                        <AlertTriangle className="w-3 h-3" />
                        Lartas
                      </span>
                    )}
                    {/* Tariff Badge */}
                    {result.bm_mfn !== undefined && result.bm_mfn !== null && (
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        result.bm_mfn === 0
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      )}>
                        BM {result.bm_mfn}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">
                  {result.description_id}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-3 mt-3 text-xs text-white/30">
                  <span>Chapter {result.chapter}</span>
                  {result.similarity > 0 && (
                    <span className="text-emerald-400/70">
                      {Math.round(result.similarity * 100)}% match
                    </span>
                  )}
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-white/30 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
