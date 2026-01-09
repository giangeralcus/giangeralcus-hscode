import { X, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

interface HSCodeSearchProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  isLoading?: boolean
}

export function HSCodeSearch({
  value,
  onChange,
  onClear,
  isLoading = false,
}: HSCodeSearchProps) {
  return (
    <div className="relative w-full">
      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari kode HS atau nama produk..."
        className={cn(
          "block w-full h-14 px-5 text-base",
          "bg-white/5 border border-white/10 rounded-xl",
          "text-white placeholder:text-white/40",
          "focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20",
          "transition-all duration-200"
        )}
        autoFocus
      />

      {/* Loading/Clear Button */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
        ) : value ? (
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
