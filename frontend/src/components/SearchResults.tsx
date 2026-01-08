import { Copy, Check, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { HSCodeResult } from '../hooks/useHSSearch'
import { cn, copyToClipboard } from '../lib/utils'

interface SearchResultsProps {
  results: HSCodeResult[]
  query: string
  onSelectCode: (code: HSCodeResult) => void
}

export function SearchResults({ results, query, onSelectCode }: SearchResultsProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopy = async (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await copyToClipboard(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (results.length === 0 && query.length >= 2) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">Tidak ada hasil untuk "{query}"</p>
        <p className="text-sm mt-2">Coba kata kunci lain</p>
      </div>
    )
  }

  if (results.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 mb-4">
        {results.length} hasil untuk "{query}"
      </p>

      {results.map((result) => (
        <div
          key={result.code}
          onClick={() => onSelectCode(result)}
          className={cn(
            "bg-white border border-gray-200 rounded-lg p-4",
            "hover:border-blue-300 hover:shadow-md",
            "cursor-pointer transition-all duration-200",
            "group"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-lg font-semibold text-blue-600">
                  {result.code_formatted || result.code}
                </span>

                <button
                  onClick={(e) => handleCopy(result.code, e)}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    "hover:bg-gray-100 text-gray-400 hover:text-gray-600",
                    copiedCode === result.code && "text-green-500 hover:text-green-500"
                  )}
                  title="Copy HS code"
                >
                  {copiedCode === result.code ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="text-gray-700 line-clamp-2">
                {result.description_id}
              </p>

              {result.description_en && (
                <p className="text-gray-500 text-sm mt-1 line-clamp-1">
                  {result.description_en}
                </p>
              )}
            </div>

            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span>Chapter {result.chapter}</span>
            {result.similarity > 0 && (
              <span>Relevance: {Math.round(result.similarity * 100)}%</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
