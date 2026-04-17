<template>


  <!-- Header -->


  <!-- Main Content -->
  <main class="flex-1 p-6">

    <!-- Video Grid -->
    <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

      <!-- Video Card -->
      <div v-for="i in videos" :key="i" class="">
        <NuxtLink :to="`/video/${i.id}`">
          <div class="bg-zinc-800 rounded-xl overflow-hidden aspect-video">
            <img class="w-full h-full object-cover" :src="baseUrl + i.thumbnail_url" :alt="i.title" />
          </div>
        </NuxtLink>
        <div class="flex mt-3 gap-3">
          <div class="w-9 h-9 bg-zinc-700 rounded-full"><img class="rounded-full" :src="i.channel.avatar_url"
              :alt="i.channel.name" /></div>
          <div>
            <NuxtLink :to="`/video/${i.id}`">
              <h3 class="text-sm font-semibold line-clamp-2">
                {{ i.title }}
              </h3>
            </NuxtLink>
            <p class="text-xs text-zinc-400">{{ i.channel.name }}</p>
            <p class="text-xs text-zinc-400">123K views • 2 days ago</p>
          </div>
        </div>

      </div>

    </div>

  </main>

</template>
<script setup>

import { getVideos } from '~/app/service/videos'
const baseUrl = import.meta.env.VITE_API_BASE_URL
const videos = ref([])

onMounted(async () => {
  videos.value = await getVideos()
})

</script>