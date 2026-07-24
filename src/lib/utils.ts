import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export function formatDate(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString('de-DE') : '—';
}

export function scoreColor(score: number) {
  if (score >= 80) return 'text-score-high';
  if (score >= 50) return 'text-score-mid';
  return 'text-score-low';
}

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Geplant',
  ACTIVE: 'Aktiv',
  PAUSED: 'Pausiert',
  COMPLETED: 'Abgeschlossen',
};
