import api from './client'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  message: string
  user_id: string
}

interface RegisterRequest {
  username: string
  email: string
  password: string
}

interface RegisterResponse {
  id: string
  username: string
  email: string
  created_at: string
}

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>('/login', credentials)
  return res.data
}

export const register = async (userData: RegisterRequest): Promise<RegisterResponse> => {
  const res = await api.post<RegisterResponse>('/users', userData)
  return res.data
}
