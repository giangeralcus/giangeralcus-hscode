import { Search, X, Loader2, Command } from 'lucide-react'
import { cn } from '../lib/utils'

interface HSCodeSearchProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  isLoading?: boolean
  placeholder?: string
}

const SEARCH_EXAMPLES = [
  { code: '0901', label: 'Kopi', color: 'from-amber-500 to-orange-500' },
  { code: '8471', label: 'Komputer', color: 'from-blue-500 to-indigo-500' },
  { code: '6403', label: 'Sepatu', color: 'from-green-500 to-emerald-500' },
  { code: '8517', label: 'Handphone', color: 'from-purple-500 to-pink-500' },
]

export function HSCodeSearch({
  value,
  onChange,
  onClear,
  isLoading = false,
  placeholder = 'Ketik HS code (0901) atau keyword (coffee, shoes)...'
}: HSCodeSearchProps) {
  return (
    <div className="w-full space-y-4">
      {/* Search Input */}
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition-opacity duration-300"></div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : (
              <Search className="h-5 w-5 group-focus-within:text-blue-500 transition-colors" />
            )}
          </div>

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "w-full h-14 pl-12 pr-12 text-lg",
              "bg-white border-2 border-gray-200 rounded-xl",
              "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
              "transition-all duration-200 shadow-sm",
              "placeholder:text-gray-400 placeholder:text-base",
              "hover:border-gray-300 hover:shadow-md"
            )}
            autoFocus
          />

          {value ? (
            <button
              onClick={onClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all hover:scale-110"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-gray-400">
              <Command className="h-3 w-3" />
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Search Examples - Only show when no search value */}
      {!value && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Coba cari:</span>
          {SEARCH_EXAMPLES.map((example) => (
            <button
              key={example.code}
              onClick={() => onChange(example.code)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-full",
                "bg-white border border-gray-200",
                "hover:shadow-md hover:scale-105",
                "transition-all duration-200",
                "group flex items-center gap-1.5"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full bg-gradient-to-br opacity-75 group-hover:opacity-100",
                example.color
              )}></span>
              <span className="font-mono font-semibold text-gray-700">{example.code}</span>
              <span className="text-gray-400">({example.label})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
