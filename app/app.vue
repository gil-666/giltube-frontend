<template>
  <div class="min-h-screen bg-zinc-950 text-white">
    
    <!-- Header -->
    <header class="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
      <h1 class="text-xl font-bold text-red-500">GilTube</h1>

      <input
        type="text"
        placeholder="Search"
        class="bg-zinc-900 px-4 py-2 rounded-full w-1/3 focus:outline-none"
      />

      <div class="flex items-center gap-4">
        <div class="w-8 h-8 bg-zinc-700 rounded-full"></div>
      </div>
    </header>

    <div class="flex">
      
      <!-- Sidebar -->
      <aside class="w-60 p-4 border-r border-zinc-800 hidden md:block">
        <nav class="space-y-3">
          <div class="hover:bg-zinc-800 p-2 rounded cursor-pointer">Home</div>
          <div class="hover:bg-zinc-800 p-2 rounded cursor-pointer">Channels</div>
          <div class="hover:bg-zinc-800 p-2 rounded cursor-pointer">Subscriptions</div>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 p-6">
        
        <!-- Video Grid -->
        <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          
          <!-- Video Card -->
          <div
            v-for="i in videos"
            :key="i"
            class="cursor-pointer"
          >
            <div class="bg-zinc-800 aspect-video rounded-xl"><img :src="baseUrl + i.thumbnail_url" :alt="i.title" /></div>

            <div class="flex mt-3 gap-3">
              <div class="w-9 h-9 bg-zinc-700 rounded-full"><img class="rounded-full" :src="i.channel.avatar_url" :alt="i.channel.name" /></div>
              <div>
                <h3 class="text-sm font-semibold line-clamp-2">
                  {{ i.title }}
                </h3>
                <p class="text-xs text-zinc-400">{{i.channel.name}}</p>
                <p class="text-xs text-zinc-400">123K views • 2 days ago</p>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  </div>
</template>
<script setup>

import { getVideos } from '~/service/videos'
const baseUrl = import.meta.env.VITE_API_BASE_URL
const videos = ref([])

onMounted(async () => {
  videos.value = await getVideos()
})

</script>