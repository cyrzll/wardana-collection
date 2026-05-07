<script setup>
import { ChevronLeft } from 'lucide-vue-next'

const router = useRouter()

const props = defineProps({
  to: {
    type: String,
    default: null
  },
  label: {
    type: String,
    default: 'Kembali'
  }
})

function handleBack() {
  if (props.to) {
    navigateTo(props.to)
  } else if (import.meta.client && window.history.length > 1) {
    router.back()
  } else {
    navigateTo('/')
  }
}
</script>

<template>
  <button 
    @click="handleBack"
    class="group flex items-center gap-3 py-2 px-1 hover:opacity-70 transition-all duration-300"
  >
    <div class="p-2 border border-border group-hover:border-soft-black transition-colors rounded-full">
      <ChevronLeft :size="16" />
    </div>
    <span class="text-[10px] uppercase tracking-[0.3em] font-bold text-muted group-hover:text-soft-black transition-colors">{{ label }}</span>
  </button>
</template>
