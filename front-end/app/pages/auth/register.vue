<script setup>
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const { showAlert } = useAlert()
const username = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleRegister() {
  loading.value = true
  errorMsg.value = ''
  
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { 
        username: username.value, 
        email: email.value, 
        password: password.value 
      }
    })
    
    showAlert('Akun Anda berhasil dibuat. Selamat datang di Wardana!', 'success', 'Pendaftaran Berhasil')
    
    setTimeout(() => {
      navigateTo('/auth/login')
    }, 2000)
  } catch (err) {
    errorMsg.value = err.data?.statusMessage || 'Pendaftaran gagal. Silakan coba lagi.'
    showAlert(errorMsg.value, 'error', 'Kesalahan Pendaftaran')
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
          <h1 class="text-3xl font-serif mb-2">Bergabung dengan Wardana</h1>
          <p class="text-sm text-muted font-sans uppercase tracking-widest">Buat akun premium Anda</p>
        </div>

        <div v-if="errorMsg" class="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs uppercase tracking-wider text-center">
          {{ errorMsg }}
        </div>

        <form class="space-y-6" @submit.prevent="handleRegister">
          <div>
            <label class="block text-[10px] uppercase tracking-widest font-bold mb-2">Nama Lengkap</label>
            <div class="relative">
              <input 
                v-model="username"
                type="text" 
                required
                class="w-full border border-border px-4 py-3 focus:outline-none focus:border-soft-black transition-colors font-sans text-sm"
                placeholder="John Doe"
              />
              <User :size="16" class="absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
            </div>
          </div>

          <div>
            <label class="block text-[10px] uppercase tracking-widest font-bold mb-2">Alamat Email</label>
            <div class="relative">
              <input 
                v-model="email"
                type="email" 
                required
                class="w-full border border-border px-4 py-3 focus:outline-none focus:border-soft-black transition-colors font-sans text-sm"
                placeholder="name@example.com"
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

          <div class="text-[10px] text-muted uppercase tracking-wider leading-relaxed">
            Dengan membuat akun, Anda menyetujui 
            <a href="#" class="underline underline-offset-2 hover:text-soft-black">Ketentuan Layanan</a> dan 
            <a href="#" class="underline underline-offset-2 hover:text-soft-black">Kebijakan Privasi</a> kami.
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
              Buat Akun
              <ArrowRight :size="16" class="group-hover:translate-x-1 transition-transform" />
            </template>
          </button>
        </form>

        <div class="mt-8 text-center pt-8 border-t border-border">
          <p class="text-xs text-muted uppercase tracking-widest">
            Sudah punya akun? 
            <NuxtLink to="/auth/login" class="text-soft-black font-bold hover:underline underline-offset-4">Masuk</NuxtLink>
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
