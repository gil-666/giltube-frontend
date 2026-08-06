import api from './client'

export const downloadAPIFile = async (path: string, fileName: string) => {
  const res = await api.get(path, {
    responseType: 'blob',
    timeout: 0,
  })

  const blob = res.data instanceof Blob
    ? res.data
    : new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
