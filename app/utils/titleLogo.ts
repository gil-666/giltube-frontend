// Picks a movie's or series' TMDB title logo for a locale ("es", "es-MX"),
// falling back to the English or language-neutral one.
export const titleLogoUrl = (logos: Record<string, string> | null | undefined, locale: string) => {
  if (!logos) return ''
  return logos[String(locale || '').toLowerCase().split('-')[0]] || logos.en || ''
}
