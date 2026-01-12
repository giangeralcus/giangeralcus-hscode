import { useState, useEffect, useRef } from 'react'
import { Sparkles, Send, Loader2, Copy, Check, ChevronRight, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { useAIClassify, ClassificationResult } from '../hooks/useAIClassify'
import { cn, copyToClipboard } from '../lib/utils'

interface CodeAssistantProps {
  onSelectCode?: (code: string) => void
}

export function CodeAssistant({ onSelectCode }: CodeAssistantProps) {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<ClassificationResult[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { classify, isLoading, error, llmStatus, checkStatus } = useAIClassify()

  // Check LLM status on mount
  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 30000) // Check every 30s
    return () => clearInterval(interval)
  }, [checkStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const result = await classify(input)
    if (result) {
      setResults(result.classifications || [])
      setKeywords(result.keywords || [])
    }
  }

  const handleCopy = async (code: string) => {
    const success = await copyToClipboard(code)
    if (success) {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    }
  }

  const handleSelectCode = (code: string) => {
    if (onSelectCode) {
      onSelectCode(code)
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'low': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      default: return 'text-white/60 bg-white/5 border-white/10'
    }
  }

  const isOnline = llmStatus?.available && llmStatus?.hasModel

  return (
    <div
      className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 rounded-2xl overflow-hidden"
      role="region"
      aria-label="AI Classification Assistant"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20" aria-hidden="true">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 id="ai-assistant-title" className="font-semibold text-white">AI Classification</h2>
            <p className="text-xs text-white/50">Describe your product, AI will find the HS code</p>
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
            isOnline
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          )}
          role="status"
          aria-live="polite"
          aria-label={isOnline ? 'AI service online' : 'AI service offline'}
        >
          {isOnline ? <Wifi className="w-3 h-3" aria-hidden="true" /> : <WifiOff className="w-3 h-3" aria-hidden="true" />}
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4" aria-labelledby="ai-assistant-title">
        <div className="relative">
          <label htmlFor="product-description" className="sr-only">
            Product description for HS code classification
          </label>
          <textarea
            id="product-description"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Contoh: Laptop 14 inch untuk gaming dengan prosesor Intel Core i7..."
            className={cn(
              "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12",
              "text-white placeholder:text-white/30 resize-none",
              "focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50",
              "transition-all duration-200"
            )}
            rows={3}
            disabled={isLoading || !isOnline}
            aria-describedby={!isOnline ? 'offline-message' : undefined}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !isOnline}
            className={cn(
              "absolute bottom-3 right-3 p-2 rounded-lg transition-all",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              input.trim() && isOnline
                ? "bg-cyan-500 text-white hover:bg-cyan-400"
                : "bg-white/10 text-white/40"
            )}
            aria-label={isLoading ? 'Classifying product...' : 'Submit for classification'}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm" role="alert" aria-live="assertive">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            {error}
          </div>
        )}

        {/* Offline Message */}
        {!isOnline && (
          <div
            id="offline-message"
            className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm"
            role="alert"
          >
            <p className="font-medium">AI tidak tersedia</p>
            <p className="text-yellow-400/70 text-xs mt-1">
              Pastikan backend berjalan: <code className="bg-white/10 px-1 rounded">cd backend && npm run dev</code>
            </p>
          </div>
        )}
      </form>

      {/* Results */}
      {results.length > 0 && (
        <div className="px-4 pb-4 space-y-3" aria-live="polite" aria-label="Classification results">
          {/* Keywords */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5" role="list" aria-label="Detected keywords">
              {keywords.map((kw, i) => (
                <span
                  key={i}
                  role="listitem"
                  className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-white/50"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Classification Results */}
          <div className="space-y-2" role="list" aria-label="HS code suggestions">
            {results.map((result, i) => (
              <div
                key={i}
                role="listitem"
                className={cn(
                  "p-4 bg-white/5 border border-white/10 rounded-xl",
                  "hover:bg-white/[0.07] hover:border-white/20 transition-all",
                  "cursor-pointer group"
                )}
                onClick={() => handleSelectCode(result.hs_code)}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectCode(result.hs_code)}
                tabIndex={0}
                aria-label={`HS code ${result.hs_formatted || result.hs_code}, confidence ${result.confidence}, ${result.description}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-lg font-semibold text-cyan-400">
                        {result.hs_formatted || result.hs_code}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium border",
                        getConfidenceColor(result.confidence)
                      )}>
                        {result.confidence === 'high' ? 'Tinggi' :
                         result.confidence === 'medium' ? 'Sedang' : 'Rendah'}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm line-clamp-2">
                      {result.description}
                    </p>
                    {result.reasoning && (
                      <p className="text-white/40 text-xs mt-2 italic">
                        {result.reasoning}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(result.hs_code)
                      }}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        "hover:bg-white/10",
                        copiedCode === result.hs_code
                          ? "text-emerald-400"
                          : "text-white/30 hover:text-white/60"
                      )}
                      aria-label={copiedCode === result.hs_code ? `Copied ${result.hs_code}` : `Copy ${result.hs_code} to clipboard`}
                    >
                      {copiedCode === result.hs_code ? (
                        <Check className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Copy className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" aria-hidden="true" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-white/30 text-center pt-2" role="note">
            Hasil AI bersifat saran. Verifikasi dengan database BTKI resmi.
          </p>
        </div>
      )}
    </div>
  )
}
