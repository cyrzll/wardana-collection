<script setup>
import { 
  Wallet, Plus, ArrowUpRight, 
  ArrowDownLeft, History, Lock, ChevronRight,
  Eye, EyeOff, Loader2, CreditCard, ShieldCheck
} from 'lucide-vue-next'

const user = ref(null)
const wallet = ref(null)
const loading = ref(true)
const processing = ref(false)
const { showAlert } = useAlert()

// Change PIN State
const showChangePinModal = ref(false)
const changePinStep = ref(1) // 1: Current, 2: New, 3: Password
const currentPin = ref('')
const newPin = ref('')
const accountPassword = ref('')
const showPassword = ref(false)
const showCurrentPin = ref(false)
const showNewPin = ref(false)

function resetChangePin() {
  showChangePinModal.value = false
  changePinStep.value = 1
  currentPin.value = ''
  newPin.value = ''
  accountPassword.value = ''
  showPassword.value = false
  showCurrentPin.value = false
  showNewPin.value = false
}

async function handleChangePin() {
  if (changePinStep.value < 3) {
    if (changePinStep.value === 1 && currentPin.value.length !== 6) {
      showAlert('PIN harus 6 digit', 'error')
      return
    }
    if (changePinStep.value === 2 && newPin.value.length !== 6) {
      showAlert('PIN baru harus 6 digit', 'error')
      return
    }
    changePinStep.value++
    return
  }

  if (!accountPassword.value) {
    showAlert('Password harus diisi', 'error')
    return
  }

  processing.value = true
  try {
    await $fetch('/api/users/wallet/change-pin', {
      method: 'POST',
      body: {
        user_id: user.value.id,
        current_pin: currentPin.value,
        new_pin: newPin.value,
        password: accountPassword.value
      }
    })
    showAlert('PIN berhasil diperbarui!', 'success')
    resetChangePin()
    fetchWallet()
  } catch (e) {
    showAlert(e.data?.statusMessage || 'Gagal memperbarui PIN', 'error')
  } finally {
    processing.value = false
  }
}

async function fetchWallet() {
  if (!user.value) return
  loading.value = true
  try {
    const data = await $fetch('/api/users/wallet', {
      params: { user_id: user.value.id }
    })
    wallet.value = data
  } catch (e) {
    console.error('Failed to fetch wallet', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('user_info')
    if (saved) {
      user.value = JSON.parse(saved)
      fetchWallet()
    } else {
      navigateTo('/auth/login')
    }
  }
})

async function handleCreateWallet() {
  if (pinInput.value.length !== 6) {
    showAlert('PIN harus 6 digit', 'error')
    return
  }

  processing.value = true
  try {
    await $fetch('/api/users/wallet', {
      method: 'POST',
      body: { 
        user_id: user.value.id,
        pin: pinInput.value
      }
    })
    showAlert('WardanaPay berhasil diaktifkan!', 'success')
    showPinModal.value = false
    fetchWallet()
  } catch (e) {
    showAlert(e.data?.statusMessage || 'Gagal mengaktifkan WardanaPay', 'error')
  } finally {
    processing.value = false
  }
}

function formatCurrency(val) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val)
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 pt-32 pb-20">
    <div class="max-w-6xl mx-auto px-6">
      <!-- Header -->
      <div class="mb-12 flex justify-between items-end">
        <div>
          <ButtonBackButton label="Dompet Digital" />
          <h1 class="text-3xl font-serif text-soft-black mt-4">WardanaPay</h1>
          <p class="text-xs text-muted uppercase tracking-widest mt-1">Kelola saldo dan transaksi pembayaran Anda</p>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <Loader2 :size="40" class="animate-spin text-neutral-200" />
      </div>

      <div v-else>
        <!-- Not Active State -->
        <div v-if="!wallet" class="bg-white border border-border overflow-hidden shadow-sm" v-motion-fade>
          <div class="p-12 text-center space-y-6">
            <div class="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet :size="40" class="text-soft-black" />
            </div>
            <div class="max-w-md mx-auto">
              <h2 class="text-2xl font-serif text-soft-black mb-2">Aktifkan WardanaPay</h2>
              <p class="text-sm text-muted">Nikmati kemudahan bertransaksi lebih cepat, aman, dan dapatkan promo eksklusif untuk setiap pembayaran menggunakan WardanaPay.</p>
            </div>
            <div class="pt-6">
              <button 
                @click="showPinModal = true"
                class="px-10 py-4 bg-soft-black text-white text-[11px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-soft-black/10"
              >
                Buat Akun WardanaPay
              </button>
            </div>
          </div>
          
          <div class="bg-neutral-50 p-8 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="flex items-start gap-4">
              <div class="p-2 bg-white rounded shadow-sm"><Lock :size="16" /></div>
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest mb-1">Keamanan Ganda</p>
                <p class="text-[9px] text-muted">Setiap transaksi dilindungi oleh PIN keamanan 6-digit.</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="p-2 bg-white rounded shadow-sm"><CreditCard :size="16" /></div>
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest mb-1">Pembayaran Instan</p>
                <p class="text-[9px] text-muted">Bayar pesanan Anda dalam hitungan detik tanpa ribet.</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="p-2 bg-white rounded shadow-sm"><History :size="16" /></div>
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest mb-1">Riwayat Lengkap</p>
                <p class="text-[9px] text-muted">Pantau semua arus kas masuk dan keluar secara transparan.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Active State -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start" v-motion-fade>
          <!-- Main Content: Balance & Quick Actions -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Balance Card -->
            <div class="bg-soft-black p-10 text-white relative overflow-hidden shadow-2xl shadow-soft-black/20 group">
              <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
              
              <div class="relative z-10 flex justify-between items-start">
                <div class="space-y-8">
                  <div>
                    <p class="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 mb-2">Total Saldo WardanaPay</p>
                    <h2 class="text-5xl font-serif tracking-tight">{{ formatCurrency(wallet.balance) }}</h2>
                  </div>
                  
                  <div class="flex gap-4">
                    <button class="px-6 py-3 bg-white text-soft-black text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-200 transition-all flex items-center gap-2">
                      <Plus :size="14" /> Isi Saldo
                    </button>
                    <button class="px-6 py-3 border border-white/20 text-[10px] uppercase tracking-widest font-bold hover:bg-white/10 transition-all flex items-center gap-2">
                      <ArrowUpRight :size="14" /> Tarik Tunai
                    </button>
                  </div>
                </div>

                <div class="text-right">
                  <div class="w-16 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center mb-4">
                    <span class="font-serif italic font-bold">W.</span>
                  </div>
                  <p class="text-[10px] uppercase tracking-widest text-neutral-400">ID Akun</p>
                  <p class="text-xs font-mono">WP-{{ user.id.toString().padStart(6, '0') }}</p>
                </div>
              </div>
            </div>

            <!-- Quick Actions Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                @click="showChangePinModal = true"
                class="bg-white p-6 border border-border flex items-center justify-between hover:border-soft-black transition-all cursor-pointer group"
              >
                <div class="flex items-center gap-4">
                  <div class="p-3 bg-neutral-50 rounded group-hover:bg-soft-black group-hover:text-white transition-all">
                    <Lock :size="20" />
                  </div>
                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-widest">Ubah PIN Keamanan</p>
                    <p class="text-[9px] text-muted">Perbarui PIN 6-digit Anda secara berkala</p>
                  </div>
                </div>
                <ChevronRight :size="16" class="text-neutral-300" />
              </div>

              <div class="bg-white p-6 border border-border flex items-center justify-between hover:border-soft-black transition-all cursor-pointer group">
                <div class="flex items-center gap-4">
                  <div class="p-3 bg-neutral-50 rounded group-hover:bg-soft-black group-hover:text-white transition-all">
                    <History :size="20" />
                  </div>
                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-widest">Riwayat Transaksi</p>
                    <p class="text-[9px] text-muted">Lihat semua mutasi saldo masuk dan keluar</p>
                  </div>
                </div>
                <ChevronRight :size="16" class="text-neutral-300" />
              </div>
            </div>
          </div>

          <!-- Sidebar: Transactions -->
          <div class="lg:col-span-1 space-y-6">
            <div class="bg-white border border-border h-full">
              <div class="p-6 border-b border-border flex justify-between items-center">
                <h3 class="text-[10px] uppercase tracking-widest font-bold text-soft-black">Aktivitas Terakhir</h3>
                <button class="text-[9px] uppercase tracking-widest font-bold text-muted hover:text-soft-black transition-colors">Lihat Semua</button>
              </div>
              <div class="p-10 text-center">
                <div class="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-300">
                  <History :size="20" />
                </div>
                <p class="text-[11px] text-muted italic leading-relaxed">Belum ada aktivitas transaksi saat ini.</p>
              </div>
            </div>

            <!-- Security Tip -->
            <div class="p-6 bg-neutral-900 text-white rounded-sm space-y-3">
              <div class="flex items-center gap-2">
                <ShieldCheck :size="14" class="text-neutral-400" />
                <p class="text-[10px] font-bold uppercase tracking-widest">Tips Keamanan</p>
              </div>
              <p class="text-[10px] text-neutral-400 leading-relaxed">Jangan pernah membagikan PIN WardanaPay Anda kepada siapapun untuk menjaga keamanan saldo Anda.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PIN Setup Modal -->
    <Teleport to="body">
      <div v-if="showPinModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <div class="absolute inset-0 bg-soft-black/80 backdrop-blur-sm" @click="showPinModal = false"></div>
        <div class="bg-white w-full max-w-md relative z-10 shadow-2xl p-10 space-y-8" v-motion-pop>
          <div class="text-center space-y-2">
            <h3 class="text-2xl font-serif text-soft-black">Atur PIN Keamanan</h3>
            <p class="text-xs text-muted leading-relaxed">Buat 6 digit angka untuk mengamankan setiap transaksi pembayaran Anda di WardanaPay.</p>
          </div>

          <div class="space-y-6">
            <div class="relative">
              <input 
                v-model="pinInput"
                :type="showPin ? 'text' : 'password'" 
                maxlength="6"
                placeholder="000000"
                class="w-full text-center text-3xl tracking-[0.5em] font-mono border-b-2 border-neutral-200 py-4 focus:outline-none focus:border-soft-black transition-colors"
              />
              <button 
                @click="showPin = !showPin"
                class="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-soft-black transition-colors"
              >
                <Eye v-if="!showPin" :size="20" />
                <EyeOff v-else :size="20" />
              </button>
            </div>

            <div class="pt-4">
              <button 
                @click="handleCreateWallet"
                :disabled="processing || pinInput.length !== 6"
                class="w-full py-5 bg-soft-black text-white text-[11px] uppercase tracking-widest font-bold hover:bg-neutral-800 disabled:bg-neutral-200 disabled:cursor-not-allowed transition-all"
              >
                <Loader2 v-if="processing" :size="16" class="animate-spin mx-auto" />
                <span v-else>Konfirmasi & Aktifkan</span>
              </button>
            </div>

            <p class="text-[9px] text-center text-muted">Jangan bagikan PIN Anda kepada siapa pun, termasuk pihak IMK Store.</p>
          </div>
        </div>
      </div>

      <!-- Change PIN Modal -->
      <div v-if="showChangePinModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <div class="absolute inset-0 bg-soft-black/80 backdrop-blur-sm" @click="resetChangePin"></div>
        <div class="bg-white w-full max-w-md relative z-10 shadow-2xl p-10 space-y-8" v-motion-pop>
          <!-- Progress Steps -->
          <div class="flex items-center justify-center gap-4 mb-2">
            <div v-for="i in 3" :key="i" class="h-1 flex-1 rounded-full transition-all duration-500"
                 :class="changePinStep >= i ? 'bg-soft-black' : 'bg-neutral-100'"></div>
          </div>

          <div class="text-center space-y-2">
            <h3 class="text-2xl font-serif text-soft-black">
              {{ changePinStep === 1 ? 'PIN Saat Ini' : changePinStep === 2 ? 'PIN Baru' : 'Konfirmasi Password' }}
            </h3>
            <p class="text-xs text-muted leading-relaxed">
              {{ changePinStep === 1 ? 'Masukkan 6 digit PIN WardanaPay Anda saat ini.' : 
                 changePinStep === 2 ? 'Masukkan 6 digit PIN baru yang ingin Anda gunakan.' : 
                 'Masukkan password akun Anda untuk mengonfirmasi perubahan PIN.' }}
            </p>
          </div>

          <div class="space-y-6">
            <!-- Step 1: Current PIN -->
            <div v-if="changePinStep === 1" class="relative" v-motion-slide-right>
              <input 
                v-model="currentPin"
                :type="showCurrentPin ? 'text' : 'password'" 
                maxlength="6"
                placeholder="000000"
                class="w-full text-center text-3xl tracking-[0.5em] font-mono border-b-2 border-neutral-200 py-4 focus:outline-none focus:border-soft-black transition-colors"
              />
              <button @click="showCurrentPin = !showCurrentPin" class="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-soft-black transition-colors">
                <Eye v-if="!showCurrentPin" :size="20" />
                <EyeOff v-else :size="20" />
              </button>
            </div>

            <!-- Step 2: New PIN -->
            <div v-if="changePinStep === 2" class="relative" v-motion-slide-right>
              <input 
                v-model="newPin"
                :type="showNewPin ? 'text' : 'password'" 
                maxlength="6"
                placeholder="000000"
                class="w-full text-center text-3xl tracking-[0.5em] font-mono border-b-2 border-neutral-200 py-4 focus:outline-none focus:border-soft-black transition-colors"
              />
              <button @click="showNewPin = !showNewPin" class="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-soft-black transition-colors">
                <Eye v-if="!showNewPin" :size="20" />
                <EyeOff v-else :size="20" />
              </button>
            </div>

            <!-- Step 3: Password -->
            <div v-if="changePinStep === 3" class="relative" v-motion-slide-right>
              <input 
                v-model="accountPassword"
                :type="showPassword ? 'text' : 'password'" 
                placeholder="Masukkan password akun"
                class="w-full text-center text-sm border-b-2 border-neutral-200 py-4 focus:outline-none focus:border-soft-black transition-colors"
              />
              <button @click="showPassword = !showPassword" class="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-soft-black transition-colors">
                <Eye v-if="!showPassword" :size="20" />
                <EyeOff v-else :size="20" />
              </button>
            </div>

            <div class="pt-4 flex gap-4">
              <button 
                v-if="changePinStep > 1"
                @click="changePinStep--"
                class="flex-1 py-5 border border-border text-[11px] uppercase tracking-widest font-bold hover:bg-neutral-50 transition-all"
              >
                Kembali
              </button>
              <button 
                @click="handleChangePin"
                :disabled="processing"
                class="flex-[2] py-5 bg-soft-black text-white text-[11px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-soft-black/10"
              >
                <Loader2 v-if="processing" :size="16" class="animate-spin mx-auto" />
                <span v-else>{{ changePinStep < 3 ? 'Lanjut' : 'Simpan Perubahan' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.text-soft-black { color: #1a1a1a; }
.bg-soft-black { background-color: #1a1a1a; }
.shadow-soft-black\/10 { shadow: 0 10px 15px -3px rgba(26, 26, 26, 0.1); }
</style>
