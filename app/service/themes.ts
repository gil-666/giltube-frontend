import api from './client'
import type { ThemeStyle } from '~/app/utils/theme'

export interface ThemeRecord {
  id: string
  share_code: string
  name: string
  primary_color: string
  accent_color: string
  background_color: string
  background_image: string
  style: ThemeStyle
  version: number
  owner_user_id: string
  owner_username: string
  is_owner: boolean
  is_retired: boolean
  is_builtin: boolean
  install_count: number
  created_at: string
  updated_at: string
}

export interface ThemeInput {
  name: string
  primary_color: string
  accent_color: string
  background_color: string
  style: ThemeStyle
}

export interface ThemeLibrary {
  active_theme_id: string | null
  themes: ThemeRecord[]
}

export const listMyThemes = async (): Promise<ThemeLibrary> => {
  const { data } = await api.get<ThemeLibrary>('/themes')
  return { active_theme_id: data.active_theme_id || null, themes: data.themes || [] }
}

export const getMyActiveTheme = async (): Promise<ThemeRecord | null> =>
  (await api.get<{ theme: ThemeRecord | null }>('/themes/active')).data.theme

export const setMyActiveTheme = async (themeId: string | null): Promise<ThemeRecord | null> =>
  (await api.put<{ theme: ThemeRecord | null }>('/themes/active', { theme_id: themeId })).data.theme

export const createTheme = async (payload: ThemeInput): Promise<ThemeRecord> =>
  (await api.post<{ theme: ThemeRecord }>('/themes', payload)).data.theme

export const updateTheme = async (id: string, payload: ThemeInput): Promise<ThemeRecord> =>
  (await api.put<{ theme: ThemeRecord }>(`/themes/${id}`, payload)).data.theme

export const deleteTheme = async (id: string): Promise<{ retired: boolean }> =>
  (await api.delete<{ deleted: boolean, retired: boolean }>(`/themes/${id}`)).data

export const uninstallTheme = async (id: string) => api.delete(`/themes/${id}/install`)

export const getSharedTheme = async (code: string): Promise<{ theme: ThemeRecord, installed: boolean }> =>
  (await api.get<{ theme: ThemeRecord, installed: boolean }>(`/themes/shared/${encodeURIComponent(code)}`)).data

export const installSharedTheme = async (code: string, activate: boolean): Promise<ThemeRecord> =>
  (await api.post<{ theme: ThemeRecord }>(`/themes/shared/${encodeURIComponent(code)}/install`, { activate })).data.theme

export const uploadThemeBackground = async (id: string, image: Blob): Promise<ThemeRecord> => {
  const form = new FormData()
  form.append('image', image, image instanceof File ? image.name : 'background.jpg')
  return (await api.post<{ theme: ThemeRecord }>(`/themes/${id}/background`, form, { timeout: 120000 })).data.theme
}

export const deleteThemeBackground = async (id: string): Promise<ThemeRecord> =>
  (await api.delete<{ theme: ThemeRecord }>(`/themes/${id}/background`)).data.theme
