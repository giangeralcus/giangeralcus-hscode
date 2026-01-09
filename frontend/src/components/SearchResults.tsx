import { Copy, Check, ChevronRight, AlertTriangle, Percent } from 'lucide-react'
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
    <div className="p-5 rounded-2xl bg-slate-800/50 border border-white/5 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <div className="h-6 w-28 bg-white/10 rounded-lg" />
            <div className="h-5 w-16 bg-white/5 rounded-full" />
          </div>
          <div className="h-4 w-full bg-white/5 rounded" />
          <div className="h-4 w-2/3 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  )
}

// Badge Component
function Badge({
  children,
  variant = 'default',
  icon: Icon
}: {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
  icon?: React.ComponentType<{ className?: string }>
}) {
  const variants = {
    default: 'bg-slate-700/50 text-slate-300 ring-slate-600/50',
    success: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 ring-rose-500/30',
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
      "text-xs font-semibold ring-1 ring-inset",
      "transition-all duration-200",
      variants[variant]
    )}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
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
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-white/40">
          <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Mencari...</span>
        </div>
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (results.length === 0 && query.length >= 2) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
          <Search className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-white/60 font-medium">Tidak ada hasil untuk "{query}"</p>
        <p className="text-sm text-white/30 mt-1">Coba kata kunci lain</p>
      </div>
    )
  }

  if (results.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">
          <span className="text-white/70 font-semibold">{results.length}</span> hasil ditemukan
        </p>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {results.map((result) => (
          <div
            key={result.code}
            onClick={() => onSelectCode(result)}
            className={cn(
              "group relative p-5 rounded-2xl cursor-pointer",
              "bg-slate-800/30 backdrop-blur-sm",
              "border border-white/5",
              "shadow-lg shadow-black/10",
              "transition-all duration-300 ease-out",
              "hover:bg-slate-800/50 hover:border-cyan-500/30",
              "hover:shadow-xl hover:shadow-cyan-500/5",
              "hover:-translate-y-0.5"
            )}
          >
            {/* Content */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-3">
                {/* Header: Code + Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* HS Code */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-cyan-400 tracking-wide">
                      {result.code_formatted || result.code}
                    </span>
                    <button
                      onClick={(e) => handleCopy(result.code, e)}
                      className={cn(
                        "p-1.5 rounded-lg transition-all duration-200",
                        "text-white/20 hover:text-white/70 hover:bg-white/10",
                        copiedCode === result.code && "text-emerald-400 bg-emerald-500/10"
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
                  <div className="flex items-center gap-2">
                    {result.has_lartas && (
                      <Badge variant="danger" icon={AlertTriangle}>
                        Lartas
                      </Badge>
                    )}
                    {result.bm_mfn !== undefined && result.bm_mfn !== null && (
                      <Badge
                        variant={result.bm_mfn === 0 ? 'success' : 'warning'}
                        icon={Percent}
                      >
                        BM {result.bm_mfn}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
                  {result.description_id}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-white/40">
                    Chapter <span className="text-white/60 font-medium">{result.chapter}</span>
                  </span>
                  {result.similarity > 0 && (
                    <span className="text-cyan-400/70 font-medium">
                      {Math.round(result.similarity * 100)}% match
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl",
                "bg-white/5 text-white/20",
                "transition-all duration-300",
                "group-hover:bg-cyan-500/20 group-hover:text-cyan-400",
                "group-hover:translate-x-0.5"
              )}>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Add Search icon for empty state
function Search({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}
