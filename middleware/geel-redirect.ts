import { getVideo } from '~/app/service/videos'

// Vertical videos of 3 minutes or less play in the Geels UI. Unless the video
// is being played from a playlist, series or movie queue, /video/<id> sends
// the viewer to /geels/<id>. The fetched video is kept so the watch page
// doesn't load it a second time.
export default defineNuxtRouteMiddleware(async (to) => {
  const id = String(to.params.id || '')
  if (!id || to.query.playlist_id || to.query.series_id || to.query.movie_id) return
  // The server already decided when it rendered this page.
  const nuxtApp = useNuxtApp()
  if (import.meta.client && nuxtApp.isHydrating && nuxtApp.payload.serverRendered) return

  let video: any = null
  try {
    video = await getVideo(id)
  } catch {
    return // the watch page shows its own not-found state
  }
  useState<any>(`video-prefetch-${id}`).value = video
  if (!video?.geel) return

  const localePrefix = /^\/es(?:\/|$)/.test(to.path) ? '/es' : ''
  return navigateTo({
    path: `${localePrefix}/geels/${id}`,
    query: to.query.comment ? { comments: '1' } : undefined,
  }, { replace: true, redirectCode: 302 })
})
