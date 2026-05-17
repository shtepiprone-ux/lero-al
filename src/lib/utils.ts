import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Strips combining diacritical marks (U+0300–U+036F) after NFD decomposition
// so "e" matches "ë", "c" matches "ç", etc. Canonical search normalization.
const _COMBINING = /[̀-ͯ]/g
export function normalizeSearch(s: string): string {
  return s.normalize('NFD').replace(_COMBINING, '').toLowerCase()
}
