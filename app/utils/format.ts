/**
 * Format view count to short notation (1K, 100K, 1M, etc)
 */
export const formatViews = (views: number): string => {
  const value = Number.isFinite(Number(views)) ? Math.max(0, Number(views)) : 0
  const compact = (amount: number, suffix: string) => {
    const rounded = Math.round(amount * 10) / 10
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}${suffix}`
  }
  if (value >= 1000000000) {
    return compact(value / 1000000000, 'B')
  }
  if (value >= 1000000) {
    return compact(value / 1000000, 'M')
  }
  if (value >= 1000) {
    return compact(value / 1000, 'K')
  }
  return Math.round(value).toString()
}

/**
 * Format number with commas (1,000,000)
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString()
}
