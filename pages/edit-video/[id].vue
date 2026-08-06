<template>
  <div class="min-h-screen bg-zinc-950 p-6 text-white">
    <div class="mx-auto max-w-[1600px]">
      <VideoEditorPanel
        :video-id="videoId"
        subheading=""
        :cancel-to="localePath('/dashboard')"
        :redirect-after-save="localePath('/dashboard')"
        show-cancel
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VideoEditorPanel from '~/app/components/admin/VideoEditorPanel.vue'
import { useMetaTags } from '~/app/composables/useMetaTags'
import { useLocalePath } from '#i18n'

const route = useRoute()
const localePath = useLocalePath()
const videoId = computed(() => route.params.id as string)

useMetaTags({
  title: 'Edit Video - GilTube',
  description: 'Edit your video details',
})

definePageMeta({
  layout: 'blank',
})
</script>
