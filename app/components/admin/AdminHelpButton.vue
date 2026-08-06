<template>
  <span class="inline-flex align-middle">
    <button
      type="button"
      class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-sm font-bold text-blue-300 transition hover:border-blue-500 hover:bg-blue-950/50"
      :aria-label="title"
      @click="open = true"
    >
      ?
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 px-4 py-8"
        @click.self="open = false"
      >
        <section class="w-full max-w-lg rounded-lg border border-zinc-700 bg-zinc-950 p-5 text-white shadow-2xl">
          <div class="flex items-start justify-between gap-4">
            <h3 class="text-lg font-semibold">{{ title }}</h3>
            <button
              type="button"
              class="rounded bg-zinc-800 px-3 py-1.5 text-sm font-semibold transition hover:bg-zinc-700"
              @click="open = false"
            >
              {{ closeLabel }}
            </button>
          </div>
          <p class="mt-3 whitespace-pre-line text-sm leading-6 text-gray-300">{{ body }}</p>
        </section>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  title: string
  body: string
  closeLabel: string
}>()

const open = ref(false)
</script>
