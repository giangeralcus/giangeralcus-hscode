import { useState, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

export interface ClassificationResult {
  hs_code: string
  hs_formatted: string
  description: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

export interface ClassificationResponse {
  classifications: ClassificationResult[]
  keywords: string[]
  material: string | null
  category: string | null
  warning?: string
}

interface LLMStatus {
  available: boolean
  hasModel: boolean
  models?: string[]
  error?: string
}

interface UseAIClassifyReturn {
  classify: (description: string) => Promise<ClassificationResponse | null>
  isLoading: boolean
  error: string | null
  llmStatus: LLMStatus | null
  checkStatus: () => Promise<void>
}

export function useAIClassify(): UseAIClassifyReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [llmStatus, setLlmStatus] = useState<LLMStatus | null>(null)

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/health`)
      const data = await response.json()
      setLlmStatus(data.llm)
    } catch (err) {
      setLlmStatus({ available: false, hasModel: false, error: 'Backend not reachable' })
    }
  }, [])

  const classify = useCallback(async (description: string): Promise<ClassificationResponse | null> => {
    if (!description || description.trim().length < 3) {
      setError('Deskripsi minimal 3 karakter')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim() })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Classification failed')
      }

      const data = await response.json()

      if (!data.result) {
        throw new Error('Invalid response from AI')
      }

      // Include warning if present (when AI couldn't classify properly)
      const result: ClassificationResponse = {
        ...data.result,
        warning: data.warning
      }

      return result

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(message)
      console.error('Classification error:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    classify,
    isLoading,
    error,
    llmStatus,
    checkStatus
  }
}

// Hook for tariff explanation
export function useAIExplain() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const explain = useCallback(async (
    hsCode: string,
    description: string,
    tariff: Record<string, number | null>
  ): Promise<string | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/explain-tariff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hs_code: hsCode,
          description,
          tariff
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Explanation failed')
      }

      const data = await response.json()
      return data.explanation || null

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(message)
      console.error('Explanation error:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { explain, isLoading, error }
}
