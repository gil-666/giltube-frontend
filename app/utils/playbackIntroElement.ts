// Browsers only allow programmatic playback *with sound* once the visitor has
// interacted with the page, and Safari/iOS go further: the specific media
// element must first have been played inside a user gesture. The playback
// intro therefore always uses this one shared element, which is "unlocked" by
// playing a silent clip on the visitor's first tap, click or key press.

let element: HTMLVideoElement | null = null
let unlocked = false
let introActive = false

const silentWavDataURI = () => {
  const sampleRate = 8000
  const samples = 800
  const buffer = new ArrayBuffer(44 + samples)
  const view = new DataView(buffer)
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }
  write(0, 'RIFF')
  view.setUint32(4, 36 + samples, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate, true)
  view.setUint16(32, 1, true)
  view.setUint16(34, 8, true)
  write(36, 'data')
  view.setUint32(40, samples, true)
  for (let i = 0; i < samples; i++) view.setUint8(44 + i, 128)
  let binary = ''
  new Uint8Array(buffer).forEach((byte) => { binary += String.fromCharCode(byte) })
  return `data:audio/wav;base64,${btoa(binary)}`
}

export const getPlaybackIntroElement = () => {
  if (!element) {
    element = document.createElement('video')
    element.playsInline = true
    element.setAttribute('playsinline', '')
    element.setAttribute('webkit-playsinline', '')
    element.preload = 'auto'
    // video.js copies the tag's classes onto the player it creates; without
    // `video-js` none of its sizing or skin CSS applies.
    element.className = 'video-js vjs-default-skin'
  }
  return element
}

// The video.js player wrapping the shared element; created on first use and
// kept so the unlocked element is never disposed.
let introPlayer: any = null

export const getPlaybackIntroPlayer = () => introPlayer

export const setPlaybackIntroPlayer = (player: any) => {
  introPlayer = player
}

export const setPlaybackIntroActive = (active: boolean) => {
  introActive = active
}

// Must be called synchronously from a user-gesture event handler.
export const unlockPlaybackIntroAudio = () => {
  if (unlocked || introActive) return
  const video = getPlaybackIntroElement()
  video.muted = false
  video.src = silentWavDataURI()
  const attempt = video.play()
  if (!attempt) return
  attempt.then(() => {
    video.pause()
    if (!introActive) {
      video.removeAttribute('src')
      video.load()
    }
    unlocked = true
  }).catch(() => {})
}
