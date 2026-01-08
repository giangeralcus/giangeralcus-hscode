import { Search, X, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

interface HSCodeSearchProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  isLoading?: boolean
  placeholder?: string
}

export function HSCodeSearch({
  value,
  onChange,
  onClear,
  isLoading = false,
  placeholder = 'Cari nama barang atau HS code...'
}: HSCodeSearchProps) {
  return (
    <div className="relative w-full">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Search className="h-5 w-5" />
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
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          "transition-all duration-200",
          "placeholder:text-gray-400"
        )}
        autoFocus
      />

      {value && (
        <button
          onClick={onClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
