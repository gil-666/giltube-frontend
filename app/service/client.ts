import axios from 'axios'

// Determine the API base URL based on environment
let fullBaseURL = '/api/v1'

// For SSR (server-side), use the direct backend URL
if (process.server) {
  fullBaseURL = 'http://localhost:8080/api/v1'
}

console.log('API Base URL:', fullBaseURL, 'Server?', process.server)

const apiClient = axios.create({
  baseURL: fullBaseURL,
  timeout: 10000,
})

// Request interceptor (optional)
apiClient.interceptors.request.use((config) => {
  // Example: attach token later
  // const token = useAuthStore().token
  // if (token) config.headers.Authorization = `Bearer ${token}`
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
