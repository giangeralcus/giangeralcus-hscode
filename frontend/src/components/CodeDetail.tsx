import { X, Copy, Check, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
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
      } catch (err) {
        console.log('No tariff data found')
      } finally {
        setLoading(false)
      }
    }

    fetchTariff()
  }, [code.code])

  const handleCopy = async () => {
    await copyToClipboard(code.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold text-blue-600">
              {code.code_formatted || code.code}
            </span>
            <button
              onClick={handleCopy}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "hover:bg-gray-100",
                copied ? "text-green-500" : "text-gray-400 hover:text-gray-600"
              )}
              title="Copy HS code"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Deskripsi (ID)</h3>
            <p className="text-gray-800">{code.description_id}</p>
          </div>

          {code.description_en && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description (EN)</h3>
              <p className="text-gray-600">{code.description_en}</p>
            </div>
          )}

          {/* Hierarchy */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Chapter</h3>
              <p className="text-gray-800 font-medium">{code.chapter}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Level</h3>
              <p className="text-gray-800 font-medium">{code.code.length}-digit</p>
            </div>
          </div>

          {/* Tariff Rates */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Tarif Bea Masuk</h3>

            {loading ? (
              <div className="text-gray-400 text-sm">Loading tariff data...</div>
            ) : tariff ? (
              <div className="grid grid-cols-2 gap-3">
                <TariffItem label="BM MFN" value={tariff.bm_mfn} />
                <TariffItem label="PPN" value={tariff.ppn} defaultValue={11} />
                <TariffItem label="PPh API" value={tariff.pph_api} />
                <TariffItem label="PPh Non-API" value={tariff.pph_non_api} />
                {tariff.bm_atiga !== null && <TariffItem label="ATIGA" value={tariff.bm_atiga} />}
                {tariff.bm_acfta !== null && <TariffItem label="ACFTA" value={tariff.bm_acfta} />}
                {tariff.bm_rcep !== null && <TariffItem label="RCEP" value={tariff.bm_rcep} />}
              </div>
            ) : (
              <div className="text-gray-400 text-sm bg-gray-50 rounded-lg p-3">
                Data tarif belum tersedia untuk kode ini
              </div>
            )}
          </div>

          {/* External Links */}
          <div className="pt-4 border-t border-gray-100">
            <a
              href={`https://www.insw.go.id/intr/commodity-detail?code=${code.code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Lihat di INSW
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function TariffItem({ label, value, defaultValue }: { label: string; value: number | null; defaultValue?: number }) {
  const displayValue = value ?? defaultValue

  if (displayValue === null || displayValue === undefined) {
    return null
  }

  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="block text-lg font-semibold text-gray-800">{displayValue}%</span>
    </div>
  )
}
