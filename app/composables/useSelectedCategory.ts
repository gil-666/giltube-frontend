import { ref, watch } from 'vue'

let selectedCategory = ref<any>(null)

export const useSelectedCategory = () => {
  // Initialize from localStorage on client-only during mount
  if (process.client && typeof window !== 'undefined' && selectedCategory.value === null) {
    const stored = localStorage.getItem('selected_category')
    if (stored) {
      try {
        selectedCategory.value = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse selected category:', e)
      }
    }
  }

  // Watch for changes and save to localStorage (client-only)
  watch(selectedCategory, (newValue) => {
    if (process.client && typeof window !== 'undefined') {
      if (newValue === null) {
        localStorage.removeItem('selected_category')
      } else {
        localStorage.setItem('selected_category', JSON.stringify(newValue))
      }
    }
  }, { deep: true })

  return {
    selectedCategory
  }
}
