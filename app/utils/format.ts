/**
 * Format view count to short notation (1K, 100K, 1M, etc)
 */
export const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + 'M'
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'K'
  }
  return views.toString()
}

/**
 * Format number with commas (1,000,000)
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString()
}
