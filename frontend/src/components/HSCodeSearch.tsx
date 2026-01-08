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
  placeholder = 'Search HS code or product name...'
}: HSCodeSearchProps) {
  return (
    <div className="relative group">
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
          )}
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-14 pl-12 pr-12",
            "bg-white/5 border border-white/10 rounded-xl",
            "text-white placeholder:text-white/30",
            "focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.07]",
            "transition-all duration-300"
          )}
          autoFocus
        />

        {value && (
          <button
            onClick={onClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md text-white/30 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
