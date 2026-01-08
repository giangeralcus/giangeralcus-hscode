import { X, Copy, Check, ExternalLink } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { cn, copyToClipboard } from '../lib/utils'
import type { HSCodeResult } from '../hooks/useHSSearch'

interface TariffData {
  bm_mfn: number | null
  ppn: number | null
  pph_api: number | null
  pph_non_api: number | null
  bm_atiga: number | null
  bm_acfta: number | null
  bm_rcep: number | null
}

interface CodeDetailProps {
  code: HSCodeResult
  onClose: () => void
}

export function CodeDetail({ code, onClose }: CodeDetailProps) {
  const [tariff, setTariff] = useState<TariffData | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    const fetchTariff = async () => {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('hs_tariffs')
          .select('bm_mfn, ppn, pph_api, pph_non_api, bm_atiga, bm_acfta, bm_rcep')
          .eq('hs_code', code.code)
          .single()
        setTariff(data)
      } catch {
        // No tariff data available
      } finally {
        setLoading(false)
      }
    }
    fetchTariff()
  }, [code.code])

  const handleCopy = async () => {
    const success = await copyToClipboard(code.code)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#0c0c10] border border-white/10 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0c0c10] border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-semibold text-cyan-400">
              {code.code_formatted || code.code}
            </span>
            <button
              onClick={handleCopy}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                "hover:bg-white/10",
                copied ? "text-emerald-400" : "text-white/40 hover:text-white/60"
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/60 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-white/80 leading-relaxed">{code.description_id}</p>
            {code.description_en && code.description_en !== code.description_id && (
              <p className="text-white/50 text-sm mt-2 italic">{code.description_en}</p>
            )}
          </div>

          {/* Hierarchy */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-xs text-white/40">Chapter</span>
              <p className="text-white/80 font-medium mt-1">{code.chapter}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-xs text-white/40">Level</span>
              <p className="text-white/80 font-medium mt-1">{code.code.length}-digit</p>
            </div>
          </div>

          {/* Tariff */}
          <div>
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Tariff Rates</h3>
            {loading ? (
              <div className="text-white/30 text-sm animate-pulse">Loading...</div>
            ) : tariff ? (
              <div className="grid grid-cols-2 gap-2">
                <TariffItem label="BM MFN" value={tariff.bm_mfn} />
                <TariffItem label="PPN" value={tariff.ppn} defaultValue={11} />
                <TariffItem label="PPh API" value={tariff.pph_api} />
                <TariffItem label="PPh Non-API" value={tariff.pph_non_api} />
                {tariff.bm_atiga !== null && <TariffItem label="ATIGA" value={tariff.bm_atiga} />}
                {tariff.bm_acfta !== null && <TariffItem label="ACFTA" value={tariff.bm_acfta} />}
              </div>
            ) : (
              <p className="text-white/30 text-sm">No tariff data available</p>
            )}
          </div>

          {/* Link */}
          <div className="pt-4 border-t border-white/5">
            <a
              href={`https://www.insw.go.id/intr/commodity-detail?code=${code.code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on INSW
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function TariffItem({ label, value, defaultValue }: { label: string; value: number | null; defaultValue?: number }) {
  const displayValue = value ?? defaultValue
  if (displayValue === null || displayValue === undefined) return null

  const isZero = displayValue === 0

  return (
    <div className={cn(
      "px-3 py-2 rounded-lg border",
      isZero
        ? "bg-emerald-500/10 border-emerald-500/20"
        : "bg-white/5 border-white/5"
    )}>
      <span className="text-xs text-white/40">{label}</span>
      <p className={cn(
        "font-semibold mt-0.5",
        isZero ? "text-emerald-400" : "text-white/80"
      )}>
        {displayValue}%
      </p>
    </div>
  )
}
