<script setup>
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-vue-next'

definePageMeta({
  layout: false 
})

const identifier = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

onMounted(() => {
  if (import.meta.client) {
    const savedUser = localStorage.getItem('user_info')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        if (user.level === 'admin') {
          navigateTo('/admin/dashboard')
        } else {
          navigateTo('/product/all')
        }
      } catch (e) {
        localStorage.removeItem('user_info')
      }
    }
  }
})

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const data = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: identifier.value, password: password.value }
    })
    
    // Save to localStorage
    if (import.meta.client) {
      localStorage.setItem('user_info', JSON.stringify(data.user))
    }
    
    if (data.user.level === 'admin') {
      navigateTo('/admin/dashboard')
    } else {
      navigateTo('/product/all')
    }
  } catch (err) {
    errorMsg.value = err.data?.statusMessage || 'Gagal masuk. Silakan coba lagi.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-soft-white flex flex-col">
    <!-- Simple Header -->
    <header class="p-8">
      <NuxtLink to="/" class="text-xl font-serif tracking-[0.2em] uppercase">WARDANA</NuxtLink>
    </header>

    <div class="flex-1 flex items-center justify-center px-6 pb-20">
      <div class="w-full max-w-md bg-white p-10 border border-border shadow-sm" v-motion-fade>
        <div class="text-center mb-10">
          <h1 class="text-3xl font-serif mb-2">Selamat Datang Kembali</h1>
          <p class="text-sm text-muted font-sans uppercase tracking-widest">Masuk ke akun Anda</p>
        </div>

        <div v-if="errorMsg" class="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs uppercase tracking-wider text-center">
          {{ errorMsg }}
        </div>

        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label class="block text-[10px] uppercase tracking-widest font-bold mb-2">Email atau Username</label>
            <div class="relative">
              <input 
                v-model="identifier"
                type="text" 
                required
                class="w-full border border-border px-4 py-3 focus:outline-none focus:border-soft-black transition-colors font-sans text-sm"
                placeholder="Masukkan email atau username Anda"
              />
              <Mail :size="16" class="absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
            </div>
          </div>

          <div>
            <label class="block text-[10px] uppercase tracking-widest font-bold mb-2">Kata Sandi</label>
            <div class="relative">
              <input 
                v-model="password"
                type="password" 
                required
                class="w-full border border-border px-4 py-3 focus:outline-none focus:border-soft-black transition-colors font-sans text-sm"
                placeholder="••••••••"
              />
              <Lock :size="16" class="absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input type="checkbox" id="remember" class="w-4 h-4 border-border rounded-none focus:ring-0 text-soft-black" />
              <label for="remember" class="ml-2 text-xs text-muted uppercase tracking-wider">Ingat saya</label>
            </div>
            <a href="#" class="text-xs text-muted hover:text-soft-black transition-colors uppercase tracking-wider underline underline-offset-4">Lupa kata sandi?</a>
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="w-full btn-luxury group flex items-center justify-center gap-3"
          >
            <template v-if="loading">
              <Loader2 :size="16" class="animate-spin" />
              Memproses...
            </template>
            <template v-else>
              Masuk
              <ArrowRight :size="16" class="group-hover:translate-x-1 transition-transform" />
            </template>
          </button>
        </form>

        <div class="mt-8 text-center pt-8 border-t border-border">
          <p class="text-xs text-muted uppercase tracking-widest">
            Belum punya akun? 
            <NuxtLink to="/auth/register" class="text-soft-black font-bold hover:underline underline-offset-4">Buat akun</NuxtLink>
          </p>
        </div>
      </div>
    </div>

    <!-- Simple Footer -->
    <footer class="p-8 text-center">
      <p class="text-[10px] uppercase tracking-widest text-muted">© 2024 WARDANA. HAK CIPTA DILINDUNGI.</p>
    </footer>
    <!-- Universal Alert Modal -->
    <ModalAlertModal />
  </div>
</template>
