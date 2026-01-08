import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatHSCode(code: string): string {
  const clean = code.replace(/\D/g, '')
  if (clean.length >= 8) {
    return `${clean.slice(0, 4)}.${clean.slice(4, 6)}.${clean.slice(6, 8)}`
  } else if (clean.length >= 6) {
    return `${clean.slice(0, 4)}.${clean.slice(4, 6)}`
  } else if (clean.length >= 4) {
    return clean.slice(0, 4)
  }
  return clean
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}
