<script setup>
import { Ticket, Search, Gift, Clock, CheckCircle2, AlertCircle } from 'lucide-vue-next'

const user = ref(null)
const availableVouchers = ref([])
const myVouchers = ref([])
const loading = ref(true)
const { showAlert } = useAlert()

async function fetchData() {
  if (!user.value) return
  loading.value = true
  try {
    const [available, owned] = await Promise.all([
      $fetch('/api/vouchers/available', { params: { user_id: user.value.id } }),
      $fetch('/api/vouchers/my', { params: { user_id: user.value.id } })
    ])
    availableVouchers.value = Array.isArray(available) ? available : []
    myVouchers.value = Array.isArray(owned) ? owned : []
  } catch (e) {
    showAlert('Gagal mengambil data voucher', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('user_info')
    if (saved) {
      user.value = JSON.parse(saved)
      fetchData()
    } else {
      navigateTo('/auth/login')
    }
  }
})

async function claimVoucher(id) {
  try {
    await $fetch('/api/vouchers/claim', {
      method: 'POST',
      body: { user_id: user.value.id, voucher_id: id }
    })
    showAlert('Voucher berhasil diklaim!', 'success')
    fetchData()
  } catch (e) {
    showAlert(e.data?.statusMessage || 'Gagal mengklaim voucher', 'error')
  }
}

function formatDate(date) {
  if (!date) return 'Tanpa Batas Waktu'
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 pt-32 pb-20">
    <div class="max-w-5xl mx-auto px-6">
      <!-- Header -->
      <div class="mb-12">
        <ButtonBackButton label="Voucher & Promo" />
        <p class="text-xs text-muted uppercase tracking-widest mt-4 pl-12">Klaim penawaran terbaik untuk belanja Anda</p>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="w-10 h-10 border-4 border-neutral-200 border-t-soft-black rounded-full animate-spin"></div>
      </div>

      <div v-else class="space-y-16">
        <!-- Available Vouchers Section -->
        <section class="space-y-8">
          <div class="flex items-center gap-3 border-b border-border pb-4">
            <Gift :size="20" class="text-soft-black" />
            <h2 class="text-xs uppercase tracking-[0.2em] font-bold">Voucher Tersedia</h2>
          </div>

          <div v-if="availableVouchers.length === 0" class="bg-white p-12 border border-border text-center">
            <Ticket :size="40" class="mx-auto text-neutral-200 mb-4" />
            <p class="text-sm text-muted">Belum ada voucher baru yang tersedia untuk diklaim.</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="v in availableVouchers" :key="v.id" class="bg-white border border-border flex group hover:border-soft-black transition-all">
              <!-- Ticket Left (Visual) -->
              <div class="w-24 bg-neutral-50 flex flex-col items-center justify-center p-4 border-r border-dashed border-border relative overflow-hidden">
                <div class="absolute -top-3 -right-3 w-6 h-6 bg-neutral-50 rounded-full border border-border"></div>
                <div class="absolute -bottom-3 -right-3 w-6 h-6 bg-neutral-50 rounded-full border border-border"></div>
                <Ticket :size="24" class="text-neutral-300 group-hover:text-soft-black transition-colors" />
                <span class="text-[8px] uppercase font-bold tracking-widest mt-2 vertical-text">{{ v.type }}</span>
              </div>
              
              <!-- Ticket Right (Info) -->
              <div class="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div class="flex justify-between items-start mb-1">
                    <p class="text-[10px] font-bold tracking-widest uppercase text-muted">{{ v.code }}</p>
                    <span v-if="v.end_date" class="flex items-center gap-1 text-[8px] uppercase tracking-widest text-red-500 font-bold">
                      <Clock :size="10" />
                      Waktu Terbatas
                    </span>
                  </div>
                  <h3 class="text-sm font-bold text-soft-black mb-1">{{ v.title }}</h3>
                  <p class="text-[10px] text-muted leading-relaxed">
                    {{ v.discount_type === 'percent' ? `Diskon ${v.discount_value}%` : `Potongan Rp${v.discount_value.toLocaleString()}` }}
                    dengan minimal belanja Rp{{ v.min_purchase.toLocaleString() }}.
                  </p>
                </div>
                
                <div class="mt-6 flex items-center justify-between">
                  <p class="text-[8px] uppercase tracking-widest text-muted">Berlaku s/d {{ formatDate(v.end_date) }}</p>
                  <button @click="claimVoucher(v.id)" class="px-6 py-2 bg-soft-black text-white text-[9px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all shadow-lg shadow-soft-black/10">
                    Klaim Sekarang
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Owned Vouchers Section (Tabel) -->
        <section class="space-y-8">
          <div class="flex items-center gap-3 border-b border-border pb-4">
            <CheckCircle2 :size="20" class="text-green-600" />
            <h2 class="text-xs uppercase tracking-[0.2em] font-bold">Voucher Saya (Koleksi)</h2>
          </div>

          <div v-if="myVouchers.length === 0" class="bg-white p-12 border border-border text-center">
            <p class="text-sm text-muted italic">Anda belum memiliki voucher yang diklaim.</p>
          </div>

          <div v-else class="bg-white border border-border overflow-hidden">
            <table class="w-full text-left">
              <thead>
                <tr class="bg-neutral-50 border-b border-border">
                  <th class="p-6 text-[10px] uppercase tracking-widest font-bold">Detail Voucher</th>
                  <th class="p-6 text-[10px] uppercase tracking-widest font-bold">Nilai & Tipe</th>
                  <th class="p-6 text-[10px] uppercase tracking-widest font-bold">Status</th>
                  <th class="p-6 text-[10px] uppercase tracking-widest font-bold">Masa Berlaku</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="uv in myVouchers" :key="uv.id" class="hover:bg-neutral-50/50 transition-colors">
                  <td class="p-6">
                    <div>
                      <p class="text-[10px] font-bold tracking-widest uppercase mb-1">{{ uv.code }}</p>
                      <p class="text-xs text-soft-black font-medium">{{ uv.title }}</p>
                    </div>
                  </td>
                  <td class="p-6">
                    <div class="space-y-1">
                      <p class="text-sm font-bold text-soft-black">
                        {{ uv.discount_type === 'percent' ? uv.discount_value + '%' : 'Rp' + uv.discount_value.toLocaleString() }}
                      </p>
                      <span class="px-2 py-0.5 bg-neutral-100 text-[8px] uppercase font-bold rounded">
                        {{ uv.type === 'harga' ? 'Diskon' : 'Ongkir' }}
                      </span>
                    </div>
                  </td>
                  <td class="p-6">
                    <span 
                      :class="uv.is_used ? 'bg-neutral-100 text-neutral-500' : 'bg-green-50 text-green-700'"
                      class="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest"
                    >
                      {{ uv.is_used ? 'Sudah Digunakan' : 'Tersedia' }}
                    </span>
                  </td>
                  <td class="p-6">
                    <div class="flex flex-col gap-1">
                      <p class="text-[10px] text-soft-black">{{ formatDate(uv.end_date) }}</p>
                      <p class="text-[8px] text-muted italic">Diklaim: {{ new Date(uv.claimed_at).toLocaleDateString('id-ID') }}</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-soft-black { color: #1a1a1a; }
.bg-soft-black { background-color: #1a1a1a; }

.vertical-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
