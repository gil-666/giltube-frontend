import axios from 'axios'

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const fullBaseURL = `${apiBaseURL}/api/v1`

console.log('API Base URL:', fullBaseURL)

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
export { apiBaseURL }
