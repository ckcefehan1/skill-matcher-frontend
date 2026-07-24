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

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Geplant',
  ACTIVE: 'Aktiv',
  PAUSED: 'Pausiert',
  COMPLETED: 'Abgeschlossen',
};
