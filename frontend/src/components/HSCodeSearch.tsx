import { Search, X, Loader2 } from 'lucide-react'
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
    <div className="relative w-full group">
      {/* Glow Effect */}
      <div className={cn(
        "absolute -inset-0.5 rounded-2xl opacity-0 blur transition-all duration-500",
        "bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-cyan-500/50",
        "group-focus-within:opacity-100"
      )} />

      {/* Input Container */}
      <div className={cn(
        "relative flex items-center gap-3",
        "bg-slate-900/80 backdrop-blur-xl",
        "border border-white/10 rounded-2xl",
        "shadow-xl shadow-black/20",
        "transition-all duration-300",
        "group-focus-within:border-cyan-500/50",
        "group-focus-within:bg-slate-900/90"
      )}>
        {/* Search Icon */}
        <div className="pl-5">
          <Search className={cn(
            "w-5 h-5 transition-colors duration-300",
            value ? "text-cyan-400" : "text-white/30",
            "group-focus-within:text-cyan-400"
          )} />
        </div>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cari kode HS atau nama produk..."
          className={cn(
            "flex-1 h-14 bg-transparent",
            "text-base text-white placeholder:text-white/40",
            "focus:outline-none",
            "transition-all duration-200"
          )}
          autoFocus
        />

        {/* Loading/Clear Button */}
        <div className="pr-4">
          {isLoading ? (
            <div className="p-2">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            </div>
          ) : value ? (
            <button
              onClick={onClear}
              className={cn(
                "p-2 rounded-xl",
                "text-white/40 hover:text-white",
                "hover:bg-white/10",
                "transition-all duration-200"
              )}
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
