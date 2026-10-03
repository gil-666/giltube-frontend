import { unlockPlaybackIntroAudio } from '~/app/utils/playbackIntroElement'

// Unlock audible intro playback on user gestures anywhere in the app, so the
// intro can start with sound when a movie or episode is opened later. The call
// is a no-op once the shared element is unlocked.
export default defineNuxtPlugin(() => {
  for (const event of ['pointerdown', 'touchend', 'keydown']) {
    document.addEventListener(event, unlockPlaybackIntroAudio, true)
  }
})
