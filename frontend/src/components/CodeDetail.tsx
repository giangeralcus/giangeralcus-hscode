import { X, Copy, Check, ExternalLink, AlertTriangle, FileText, Shield, ShieldCheck, Layers, Hash } from 'lucide-react'
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

interface LartasData {
  id: number
  lartas_type: string
  trade_type: string
  agency_code: string | null
  agency_name: string | null
  requirement: string
  document_type: string | null
  permit_name: string | null
  regulation_number: string | null
}

interface CodeDetailProps {
  code: HSCodeResult
  onClose: () => void
}

export function CodeDetail({ code, onClose }: CodeDetailProps) {
  const [tariff, setTariff] = useState<TariffData | null>(null)
  const [lartas, setLartas] = useState<LartasData[]>([])
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
    const fetchData = async () => {
      setLoading(true)

      try {
        const { data } = await supabase
          .from('hs_tariffs')
          .select('bm_mfn, ppn, pph_api, pph_non_api, bm_atiga, bm_acfta, bm_rcep')
          .eq('hs_code', code.code)
          .single()
        if (data) setTariff(data)
      } catch {
        // No tariff data available
      }

      try {
        const { data } = await supabase
          .from('hs_lartas')
          .select('id, lartas_type, trade_type, agency_code, agency_name, requirement, document_type, permit_name, regulation_number')
          .eq('hs_code', code.code)
          .eq('is_active', true)
        if (data) setLartas(data)
      } catch {
        // No lartas data available
      }

      setLoading(false)
    }
    fetchData()
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
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      {/* Modal Card */}
      <div className={cn(
        "relative w-full max-w-xl max-h-[90vh] overflow-hidden",
        "bg-gradient-to-b from-slate-900 to-slate-950",
        "border border-white/10 rounded-3xl",
        "shadow-2xl shadow-black/50"
      )}>
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />

        {/* Header */}
        <div className={cn(
          "relative sticky top-0 z-10",
          "px-6 py-5",
          "bg-slate-900/80 backdrop-blur-xl",
          "border-b border-white/5"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Code Badge */}
              <div className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-xl",
                "bg-cyan-500/10 border border-cyan-500/20"
              )}>
                <Hash className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xl font-bold text-cyan-400 tracking-wider">
                  {code.code_formatted || code.code}
                </span>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-200",
                  "hover:bg-white/10",
                  copied
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-white/40 hover:text-white"
                )}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-200",
                "text-white/40 hover:text-white hover:bg-white/10"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative overflow-y-auto max-h-[calc(90vh-88px)] p-6 space-y-6">
          {/* Description Section */}
          <Section title="Deskripsi" icon={FileText}>
            <p className="text-white/80 leading-relaxed">{code.description_id}</p>
            {code.description_en && code.description_en !== code.description_id && (
              <p className="text-white/50 text-sm mt-3 italic border-l-2 border-white/10 pl-3">
                {code.description_en}
              </p>
            )}
          </Section>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              icon={Layers}
              label="Chapter"
              value={code.chapter}
              color="cyan"
            />
            <InfoCard
              icon={Hash}
              label="Level"
              value={`${code.code.length}-digit`}
              color="blue"
            />
          </div>

          {/* Tariff Section */}
          <Section title="Tarif Bea Masuk" icon={Shield}>
            {loading ? (
              <LoadingState />
            ) : tariff ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <TariffCard label="BM MFN" value={tariff.bm_mfn} primary />
                <TariffCard label="PPN" value={tariff.ppn} defaultValue={11} />
                <TariffCard label="PPh API" value={tariff.pph_api} />
                <TariffCard label="PPh Non-API" value={tariff.pph_non_api} />
                {tariff.bm_atiga !== null && <TariffCard label="ATIGA" value={tariff.bm_atiga} />}
                {tariff.bm_acfta !== null && <TariffCard label="ACFTA" value={tariff.bm_acfta} />}
                {tariff.bm_rcep !== null && <TariffCard label="RCEP" value={tariff.bm_rcep} />}
              </div>
            ) : (
              <EmptyState message="Data tarif tidak tersedia" />
            )}
          </Section>

          {/* Lartas Section */}
          <Section title="Lartas (Pembatasan)" icon={AlertTriangle}>
            {loading ? (
              <LoadingState />
            ) : lartas.length > 0 ? (
              <div className="space-y-3">
                {lartas.map((item) => (
                  <LartasCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className={cn(
                "flex items-center gap-3 p-4 rounded-xl",
                "bg-emerald-500/10 border border-emerald-500/20"
              )}>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Bebas Lartas</span>
              </div>
            )}
          </Section>

          {/* External Link */}
          <div className="pt-4 border-t border-white/5">
            <a
              href="https://insw.go.id/intr"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-3 px-4 py-3 rounded-xl",
                "bg-white/5 border border-white/10",
                "text-white/70 hover:text-cyan-400",
                "transition-all duration-200",
                "hover:bg-cyan-500/10 hover:border-cyan-500/30"
              )}
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm font-medium">Cari di INSW</span>
              <span className="font-mono text-xs text-white/40 ml-2">{code.code}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Section Component
function Section({
  title,
  icon: Icon,
  children
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-white/40" />
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  )
}

// Info Card Component
function InfoCard({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: 'cyan' | 'blue'
}) {
  const colors = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
  }

  return (
    <div className={cn(
      "p-4 rounded-xl border",
      "bg-gradient-to-br",
      colors[color]
    )}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-white/40" />
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

// Tariff Card Component
function TariffCard({
  label,
  value,
  defaultValue,
  primary
}: {
  label: string
  value: number | null
  defaultValue?: number
  primary?: boolean
}) {
  const displayValue = value ?? defaultValue
  if (displayValue === null || displayValue === undefined) return null

  const isZero = displayValue === 0

  return (
    <div className={cn(
      "p-3 rounded-xl border transition-all duration-200",
      isZero
        ? "bg-emerald-500/10 border-emerald-500/20"
        : primary
        ? "bg-amber-500/10 border-amber-500/20"
        : "bg-white/5 border-white/10"
    )}>
      <span className="text-xs text-white/50 block mb-1">{label}</span>
      <span className={cn(
        "text-lg font-bold",
        isZero ? "text-emerald-400" : primary ? "text-amber-400" : "text-white/80"
      )}>
        {displayValue}%
      </span>
    </div>
  )
}

// Lartas Card Component
function LartasCard({ item }: { item: LartasData }) {
  const isProhibition = item.lartas_type === 'LARANGAN'

  return (
    <div className={cn(
      "p-4 rounded-xl border",
      isProhibition
        ? "bg-rose-500/10 border-rose-500/20"
        : "bg-amber-500/10 border-amber-500/20"
    )}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={cn(
          "w-5 h-5 flex-shrink-0 mt-0.5",
          isProhibition ? "text-rose-400" : "text-amber-400"
        )} />
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "text-xs font-bold px-2 py-1 rounded-md",
              isProhibition
                ? "bg-rose-500/20 text-rose-300"
                : "bg-amber-500/20 text-amber-300"
            )}>
              {item.lartas_type}
            </span>
            <span className="text-xs text-white/50 font-medium">
              {item.trade_type}
            </span>
            {item.agency_code && (
              <span className="text-xs text-cyan-400 font-semibold">
                {item.agency_code}
              </span>
            )}
          </div>

          {/* Requirement */}
          <p className="text-sm text-white/70 leading-relaxed">
            {item.requirement}
          </p>

          {/* Document */}
          {(item.permit_name || item.document_type) && (
            <div className="flex items-center gap-2 text-xs text-white/50">
              <FileText className="w-3.5 h-3.5" />
              <span>{item.permit_name || item.document_type}</span>
            </div>
          )}

          {/* Regulation */}
          {item.regulation_number && (
            <p className="text-xs text-white/40">
              Dasar: {item.regulation_number}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading State
function LoadingState() {
  return (
    <div className="flex items-center gap-2 text-sm text-white/30">
      <div className="w-4 h-4 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
      <span>Memuat data...</span>
    </div>
  )
}

// Empty State
function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
      <p className="text-sm text-white/40">{message}</p>
    </div>
  )
}
