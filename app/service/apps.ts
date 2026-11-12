import api from './client'

export interface DesktopRelease {
  version: string
  url: string
  size?: number
  published_at?: string
}

// Where someone is in Android closed testing:
// none -> pending (being added to the testers group) -> added (accept the
// invite) -> accepted -> installed. failed: the server could not add them.
export type AndroidAccessState = 'none' | 'pending' | 'added' | 'accepted' | 'installed' | 'failed'

export interface AndroidAccess {
  state: AndroidAccessState
  email?: string
  token?: string
  accept_url?: string
  store_url: string
  configured: boolean
}

export const getDesktopRelease = async (platform = 'win'): Promise<DesktopRelease | null> => {
  try {
    const { data } = await api.get<DesktopRelease>(`/desktop-releases/${platform}`)
    return data?.version ? data : null
  } catch {
    return null
  }
}

export const getAndroidAccess = async (token?: string): Promise<AndroidAccess> => {
  const { data } = await api.get<AndroidAccess>('/apps/android/access', { params: token ? { token } : {} })
  return data
}

export const signupAndroidTester = async (email: string): Promise<AndroidAccess> => {
  const { data } = await api.post<AndroidAccess>('/apps/android/signup', { email })
  return data
}
