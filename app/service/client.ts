import axios from 'axios'

// Determine the API base URL based on environment
let fullBaseURL = '/api/v1'

// For SSR (server-side), use the direct backend URL
if (process.server) {
  fullBaseURL = process.env.NUXT_API_INTERNAL_URL || 'http://localhost:8080/api/v1'
}

console.log('API Base URL:', fullBaseURL, 'Server?', process.server)

const apiClient = axios.create({
  baseURL: fullBaseURL,
  timeout: 60000, // 60 seconds default timeout (can be overridden per request)
})

// Request interceptor (optional)
apiClient.interceptors.request.use((config) => {
  // Add X-User-ID header if available
  const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null
  if (userId) {
    config.headers['X-User-ID'] = userId
  }
  return config
})

// Response interceptor (optional)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default apiClient
export { fullBaseURL as apiBaseURL }
export { apiBaseURL }
