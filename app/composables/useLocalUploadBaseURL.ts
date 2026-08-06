export const useLocalUploadBaseURL = () => {
  const config = useRuntimeConfig()
  const configuredURL = String(config.public.localUploadBaseUrl || '').trim()

  return configuredURL.replace(/\/+$/, '') || 'http://localhost:8080/api/v1'
}
