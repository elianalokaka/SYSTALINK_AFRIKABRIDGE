import { useCallback } from 'react'
import { useI18n } from './contexte'

/** Date courte (`14/11/2026`) dans la locale de l'interface. */
export const dateCourte = (iso: string, locale: string) => new Date(iso).toLocaleDateString(locale)

/** Heure courte (`14:05`) dans la locale de l'interface. */
export const heureCourte = (iso: string, locale: string) =>
  new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

/** `const { date, heure } = useDates()` — à utiliser à la place de `toLocale…String('fr-FR')`. */
export function useDates() {
  const { locale } = useI18n()
  return {
    date: useCallback((iso: string) => dateCourte(iso, locale), [locale]),
    heure: useCallback((iso: string) => heureCourte(iso, locale), [locale]),
    locale,
  }
}
