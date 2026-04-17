import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api/v1',
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
