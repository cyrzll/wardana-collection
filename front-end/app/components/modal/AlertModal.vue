<script setup>
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-vue-next'

const { isOpen, message, title, type, isConfirm, closeAlert, handleConfirm } = useAlert()

const typeStyles = {
  success: 'border-green-100 bg-green-50 text-green-800',
  error: 'border-red-100 bg-red-50 text-red-800',
  warning: 'border-amber-100 bg-amber-50 text-amber-800',
  info: 'border-blue-100 bg-blue-50 text-blue-800'
}

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500'
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-500 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-300 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-[100] flex items-center justify-center p-6"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-soft-black/40 backdrop-blur-sm" @click="closeAlert"></div>

      <div 
        class="bg-white border border-border shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-8 relative overflow-hidden w-full max-w-sm z-10"
      >
        <!-- Top progress bar decorator -->
        <div 
          v-if="!isConfirm"
          class="absolute top-0 left-0 h-1 transition-all duration-5000 ease-linear"
          :class="iconColors[type].replace('text', 'bg')"
          style="width: 100%"
        ></div>

        <div class="flex flex-col items-center text-center gap-6 pt-4">
          <div class="w-16 h-16 rounded-full flex items-center justify-center" :class="typeStyles[type].split(' ')[1]">
            <CheckCircle v-if="type === 'success'" :class="iconColors.success" :size="32" />
            <AlertCircle v-else-if="type === 'error'" :class="iconColors.error" :size="32" />
            <AlertTriangle v-else-if="type === 'warning'" :class="iconColors.warning" :size="32" />
            <Info v-else :class="iconColors.info" :size="32" />
          </div>
          
          <div class="space-y-2">
            <h4 class="text-[10px] uppercase tracking-[0.3em] font-bold text-muted">{{ title }}</h4>
            <p class="text-lg font-serif text-soft-black leading-relaxed">{{ message }}</p>
          </div>

          <div v-if="isConfirm" class="w-full grid grid-cols-2 gap-4 mt-4">
            <button 
              @click="closeAlert" 
              class="w-full py-4 border border-border text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-50 transition-all"
            >
              Batal
            </button>
            <button 
              @click="handleConfirm" 
              class="w-full py-4 bg-soft-black text-white text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-soft-black/10"
            >
              Konfirmasi
            </button>
          </div>
          
          <button 
            v-else
            @click="closeAlert" 
            class="w-full py-4 bg-soft-black text-white text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-soft-black/10 mt-4"
          >
            Tutup
          </button>
        </div>

        <!-- Absolute close button for non-confirm -->
        <button 
          v-if="!isConfirm"
          @click="closeAlert" 
          class="absolute top-4 right-4 text-neutral-300 hover:text-soft-black transition-colors"
        >
          <X :size="18" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.duration-5000 {
  transition-duration: 5000ms;
}
</style>
