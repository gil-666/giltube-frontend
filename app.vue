<template>
  <div class="min-h-screen bg-zinc-950 text-white flex flex-col">

    <!-- Header -->
    <header class="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
      <img
        @click="router.push('/')"
        src="./assets/logowhsmall.png"
        class="h-14 object-contain cursor-pointer"
      />

      <input
        type="text"
        placeholder="Search"
        class="bg-zinc-900 px-4 py-2 rounded-full w-1/3 focus:outline-none"
      />

      <div class="w-8 h-8 bg-zinc-700 rounded-full"></div>
    </header>

    <!-- CONTENT AREA -->
    <div class="flex flex-1 min-h-0">

      <!-- Sidebar -->
      <aside class="w-60 border-r border-zinc-800 hidden md:block">
        <nav class="p-4 space-y-3">
          <NuxtLink
            to="/"
            class="hover:bg-zinc-800 p-2 rounded cursor-pointer block"
          >Home</NuxtLink>
          <NuxtLink
            to="/channels"
            class="hover:bg-zinc-800 p-2 rounded cursor-pointer block"
          >Channels</NuxtLink>
          <NuxtLink
            to="/subscriptions"
            class="hover:bg-zinc-800 p-2 rounded cursor-pointer block"
          >Subscriptions</NuxtLink>
        </nav>
      </aside>

      <!-- Page content -->
      <div class="flex-1 overflow-auto">
        <NuxtPage />
      </div>

    </div>

  </div>
</template>

<script setup>
const router = useRouter()
</script>
