import api from './client'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  message: string
  user_id: string
  user_type?: string
  status?: string
  username?: string
  email?: string
  auth_method?: string
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

interface AccountProfile {
  id: string
  username: string
  email: string
  user_type: string
  status: string
  created_at: string
  gilid_linked: boolean
  gilid_email: string
  gilid_username: string
  gilid_linked_at: string | null
}

interface GilIDStartResponse {
  authorize_url: string
  state: string
}

interface GilIDCallbackResponse extends LoginResponse {
  gilid_linked: boolean
  linked_existing_account: boolean
  new_account: boolean
  mode: 'login' | 'link'
  return_to: string
}

interface GilIDSessionProfile {
  id: string
  email: string
  username: string
  first_name?: string
  last_name?: string
}

interface UpdateEmailRequest {
  email: string
  current_password: string
}

interface UpdatePasswordRequest {
  current_password: string
  new_password: string
}

interface DeleteAccountRequest {
  current_password: string
}

interface PasskeyBeginResponse {
  session_token: string
  options: any
}

interface PasskeyListItem {
  id: string
  name: string
  credential_id: string
  created_at: string
  last_used_at: string | null
}

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>('/login', credentials)
  return res.data
}

export const register = async (userData: RegisterRequest): Promise<RegisterResponse> => {
  const res = await api.post<RegisterResponse>('/users', userData)
  return res.data
}

export const getMyAccount = async (): Promise<AccountProfile> => {
  const res = await api.get<AccountProfile>('/account/me')
  return res.data
}

export const updateMyEmail = async (payload: UpdateEmailRequest): Promise<{ message: string; email: string }> => {
  const res = await api.put<{ message: string; email: string }>('/account/email', payload)
  return res.data
}

export const updateMyPassword = async (payload: UpdatePasswordRequest): Promise<{ message: string }> => {
  const res = await api.put<{ message: string }>('/account/password', payload)
  return res.data
}

export const deleteMyAccount = async (payload: DeleteAccountRequest): Promise<{ message: string }> => {
  const res = await api.delete<{ message: string }>('/account', { data: payload })
  return res.data
}

export const listMyPasskeys = async (): Promise<PasskeyListItem[]> => {
  const res = await api.get<PasskeyListItem[]>('/passkeys')
  return res.data
}

export const beginPasskeyRegistration = async (name: string): Promise<PasskeyBeginResponse> => {
  const res = await api.post<PasskeyBeginResponse>('/passkeys/register/begin', { name })
  return res.data
}

export const finishPasskeyRegistration = async (sessionToken: string, credentialPayload: any): Promise<{ message: string; passkey_id: string }> => {
  const res = await api.post<{ message: string; passkey_id: string }>(`/passkeys/register/finish?session_token=${encodeURIComponent(sessionToken)}`, credentialPayload)
  return res.data
}

export const beginPasskeyLogin = async (): Promise<PasskeyBeginResponse> => {
  const res = await api.post<PasskeyBeginResponse>('/passkeys/login/begin', {})
  return res.data
}

export const finishPasskeyLogin = async (sessionToken: string, credentialPayload: any): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>(`/passkeys/login/finish?session_token=${encodeURIComponent(sessionToken)}`, credentialPayload)
  return res.data
}

export const beginGilIDAuth = async (mode: 'login' | 'link', returnTo = '/'): Promise<GilIDStartResponse> => {
  const res = await api.post<GilIDStartResponse>('/oauth/gilid/start', {
    mode,
    return_to: returnTo
  })
  return res.data
}

export const completeGilIDAuth = async (code: string, state: string): Promise<GilIDCallbackResponse> => {
  const res = await api.post<GilIDCallbackResponse>('/oauth/gilid/callback', { code, state })
  return res.data
}

const gilidAPIBase = 'https://auth.gilservers.com/api'

export const getGilIDSessionProfile = async (): Promise<GilIDSessionProfile | null> => {
  try {
    const response = await fetch(`${gilidAPIBase}/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch {
    return null
  }
}

export const logoutGilIDSession = async (): Promise<void> => {
  await fetch(`${gilidAPIBase}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  })
}

export const deleteMyPasskey = async (passkeyID: string): Promise<{ message: string }> => {
  const res = await api.delete<{ message: string }>(`/passkeys/${passkeyID}`)
  return res.data
}
