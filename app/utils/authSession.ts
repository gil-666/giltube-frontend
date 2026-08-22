import { fetchUserChannels } from '~/app/service/upload'

export interface AuthSessionUser {
  user_id: string
  session_token?: string
  email?: string
  username?: string
}

const AUTH_STORAGE_KEYS = [
  'user_id',
  'session_token',
  'email',
  'username',
  'user_channels',
  'active_account',
  'active_account_name',
  'default_channel_id',
] as const

export const persistAuthSession = async (user: AuthSessionUser, fallbackEmail = ''): Promise<void> => {
  if (typeof window === 'undefined') return

  const email = user.email || fallbackEmail
  const username = user.username || email.split('@')[0] || ''

  localStorage.setItem('user_id', user.user_id)
  if (user.session_token) {
    localStorage.setItem('session_token', user.session_token)
  } else {
    localStorage.removeItem('session_token')
  }
  localStorage.setItem('email', email)
  localStorage.setItem('username', username)

  try {
    const { channels, default_channel_id: defaultChannelId } = await fetchUserChannels(user.user_id)
    const defaultChannel = channels.find(channel => channel.id === defaultChannelId)
      || channels.find(channel => channel.is_default)
      || channels[0]

    if (defaultChannel) {
      localStorage.setItem('active_account', defaultChannel.id)
      localStorage.setItem('active_account_name', defaultChannel.name)
      return
    }

    localStorage.setItem('active_account', 'personal')
    localStorage.setItem('active_account_name', username || 'Personal')
    localStorage.removeItem('default_channel_id')
  } catch (error) {
    console.error('Failed to fetch channels:', error)
  }
}

export const clearAuthSession = (): void => {
  if (typeof window === 'undefined') return
  AUTH_STORAGE_KEYS.forEach(key => localStorage.removeItem(key))
}
