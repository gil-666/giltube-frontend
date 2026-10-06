// Admin-side model for a movie/series content rating. Ratings resolve from
// TMDB on their own ("auto"); "manual" pins what the admin typed.

export const CONTENT_DESCRIPTOR_KEYS = ['violence', 'sex', 'nudity', 'language', 'drugs', 'fear', 'discrimination'] as const

export interface ContentRatingInput {
  mode: 'auto' | 'manual'
  rating: string
  descriptors: string[]
  // TMDB id picked in the metadata search; lets the resolver skip guessing.
  tmdbId: number
  // Only a changed mode or manual value is sent, so saving unrelated fields
  // never resets a resolved rating.
  dirty: boolean
}

export const emptyContentRatingInput = (): ContentRatingInput => ({
  mode: 'auto',
  rating: '',
  descriptors: [],
  tmdbId: 0,
  dirty: false,
})

export const contentRatingInputFrom = (item: any): ContentRatingInput => {
  const rating = item?.content_rating
  return {
    mode: rating?.source === 'manual' ? 'manual' : 'auto',
    rating: rating?.rating || '',
    descriptors: Array.isArray(rating?.descriptors) ? [...rating.descriptors] : [],
    tmdbId: Number(rating?.tmdb_id || 0),
    dirty: false,
  }
}

export const appendContentRating = (formData: FormData, input?: ContentRatingInput | null) => {
  if (!input) return
  if (input.tmdbId > 0) formData.append('tmdb_id', String(input.tmdbId))
  if (!input.dirty) return
  formData.append('content_rating_mode', input.mode)
  if (input.mode === 'manual') {
    formData.append('content_rating', input.rating.trim())
    formData.append('content_descriptors', input.descriptors.join(','))
  }
}
