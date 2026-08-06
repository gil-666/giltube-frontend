export interface GiphyGif {
  id: string
  title: string
  url: string
  images: {
    fixed_height: {
      url: string
      width: string
      height: string
    }
    downsized: {
      url: string
      width: string
      height: string
    }
  }
}

export interface GiphySearchResponse {
  data: GiphyGif[]
  pagination: {
    total_count: number
    count: number
    offset: number
  }
}

const GIPHY_API_KEY = 'fBgnR8ZpNiFdTN0b3FC3gEKTpg9tBztr'
const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs/search'

export const searchGiphy = async (query: string, limit: number = 20): Promise<GiphyGif[]> => {
  if (!query.trim()) return []

  try {
    const params = new URLSearchParams({
      q: query,
      api_key: GIPHY_API_KEY,
      limit: limit.toString(),
      offset: '0',
      rating: 'g',
      lang: 'en'
    })

    const response = await fetch(`${GIPHY_BASE_URL}?${params.toString()}`)
    if (!response.ok) throw new Error('Failed to fetch from Giphy')

    const data: GiphySearchResponse = await response.json()
    return data.data
  } catch (error) {
    console.error('Giphy search error:', error)
    return []
  }
}

export const getTrendingGiphy = async (limit: number = 20): Promise<GiphyGif[]> => {
  try {
    const params = new URLSearchParams({
      api_key: GIPHY_API_KEY,
      limit: limit.toString(),
      offset: '0',
      rating: 'g'
    })

    const response = await fetch(`https://api.giphy.com/v1/gifs/trending?${params.toString()}`)
    if (!response.ok) throw new Error('Failed to fetch trending from Giphy')

    const data: GiphySearchResponse = await response.json()
    return data.data
  } catch (error) {
    console.error('Giphy trending error:', error)
    return []
  }
}

export const insertGiphyIntoComment = (currentText: string, gifUrl: string, gifTitle: string): string => {
  if (currentText.trim()) {
    return `${currentText}\n${gifUrl}`
  }
  return gifUrl
}
