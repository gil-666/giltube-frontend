export const getTimeAgo = (dateString: string): string => {
  if (!dateString) return 'Unknown'
  
  // Parse the ISO string and convert to milliseconds
  const date = new Date(dateString).getTime()
  if (Number.isNaN(date)) return 'Unknown'

  const now = new Date().getTime()
  const secondsAgo = Math.floor((now - date) / 1000)

  // Small future values are usually client/server clock skew. Larger future
  // values should not stay pinned to "just now" forever.
  if (secondsAgo < -120) {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date))
  }
  if (secondsAgo < 0) return 'just now'
  if (secondsAgo < 60) return 'just now'
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`
  if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`
  if (secondsAgo < 2592000) return `${Math.floor(secondsAgo / 604800)}w ago`
  
  return `${Math.floor(secondsAgo / 2592000)}mo ago`
}
