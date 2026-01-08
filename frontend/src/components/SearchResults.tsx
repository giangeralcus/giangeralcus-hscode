import { Copy, Check, ChevronRight, FileSearch } from 'lucide-react'
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
    <div className="bg-white border border-gray-100 rounded-xl p-4 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-6 w-28 bg-gray-200 rounded-lg"></div>
            <div className="h-6 w-6 bg-gray-100 rounded-md"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded w-full"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
          </div>
          <div className="flex gap-4 mt-3">
            <div className="h-3 w-16 bg-gray-100 rounded"></div>
            <div className="h-3 w-20 bg-gray-100 rounded"></div>
          </div>
        </div>
        <div className="h-5 w-5 bg-gray-100 rounded"></div>
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <span className="inline-block h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
          Mencari "{query}"...
        </p>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  // No results
  if (results.length === 0 && query.length >= 2) {
    return (
      <div className="text-center py-16">
        <div className="relative inline-block mb-4">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-2xl border border-orange-100">
            <FileSearch className="h-10 w-10 text-orange-400" />
          </div>
        </div>
        <p className="text-lg font-medium text-gray-700">Tidak ada hasil untuk "{query}"</p>
        <p className="text-sm text-gray-500 mt-1">Coba kata kunci lain atau periksa ejaan</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="text-xs text-gray-400">Tips:</span>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">Gunakan kata dalam bahasa Inggris</span>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">Coba 4-digit kode HS</span>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{results.length}</span> hasil untuk "{query}"
        </p>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          Klik untuk detail
        </span>
      </div>

      {results.map((result, index) => (
        <div
          key={result.code}
          onClick={() => onSelectCode(result)}
          className={cn(
            "bg-white border border-gray-100 rounded-xl p-4",
            "hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50",
            "cursor-pointer transition-all duration-200",
            "group relative overflow-hidden"
          )}
          style={{
            animationDelay: `${index * 50}ms`,
            animation: 'fadeInUp 0.3s ease-out forwards'
          }}
        >
          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {result.code_formatted || result.code}
                </span>

                <button
                  onClick={(e) => handleCopy(result.code, e)}
                  className={cn(
                    "p-1.5 rounded-lg transition-all duration-200",
                    "hover:bg-gray-100 text-gray-400 hover:text-gray-600",
                    "hover:scale-110",
                    copiedCode === result.code && "text-green-500 hover:text-green-500 bg-green-50"
                  )}
                  title="Copy HS code"
                >
                  {copiedCode === result.code ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>

                {result.level && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {result.level}-digit
                  </span>
                )}
              </div>

              <p className="text-gray-700 line-clamp-2 leading-relaxed">
                {result.description_id}
              </p>

              {result.description_en && result.description_en !== result.description_id && (
                <p className="text-gray-500 text-sm mt-1.5 line-clamp-1 italic">
                  {result.description_en}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 mt-1 p-1.5 rounded-lg bg-gray-50 group-hover:bg-blue-100 transition-colors">
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </div>

          <div className="relative flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
              Chapter {result.chapter}
            </span>
            {result.similarity > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                    style={{ width: `${Math.round(result.similarity * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{Math.round(result.similarity * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
