import { ref, onMounted } from 'vue'

export const useAppInstall = () => {
  const deferredPrompt = ref(null)
  const canInstall = ref(false)

  onMounted(() => {
    if (!process.client) return

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt.value = e
      canInstall.value = true
    })

    window.addEventListener('appinstalled', () => {
      deferredPrompt.value = null
      canInstall.value = false
    })
  })

  const installApp = async () => {
    if (!deferredPrompt.value) return

    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    console.log(`User response to the install prompt: ${outcome}`)
    deferredPrompt.value = null
    canInstall.value = false
  }

  return {
    canInstall,
    installApp,
  }
}
