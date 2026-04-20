<template>
  <div v-if="verified" class="relative inline-block cursor-pointer">
    <svg 
      :class="sizeClasses" 
      fill="currentColor" 
      viewBox="0 0 20 20" 
      class="cursor-help inline-block"
      @click="isModalOpen = true"
    >
      <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
    </svg>
    
    <!-- Modal Backdrop -->
    <div 
      v-if="isModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      @click="isModalOpen = false"
    >
      <!-- Modal Content -->
      <div 
        class="bg-zinc-900 rounded-lg w-auto"
        @click.stop
      >
        <!-- Header with Close Button -->
        <div class="flex items-center justify-between p-6 border-b border-zinc-800">
          <h3 class="text-lg font-semibold text-white">Verified Channel</h3>
          <button
            @click="isModalOpen = false"
            class="text-zinc-400 hover:text-white transition text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        <!-- Message -->
        <div class="p-6">
          <p class="text-sm text-zinc-300 leading-relaxed">
            {{ tooltip }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  verified: boolean
  size?: 'sm' | 'md' | 'lg'
  tooltip?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  tooltip: ''
})

const isModalOpen = ref(false)

const sizeClasses = computed(() => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6 sm:w-8 sm:h-8'
  }
  return `${sizeMap[props.size]} text-white-400`
})
</script>

<style scoped>
</style>
