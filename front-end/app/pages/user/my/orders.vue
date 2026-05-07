<script setup>
import { 
  Package, Search, ChevronRight, Truck, 
  CheckCircle2, Clock, XCircle, ShoppingBag,
  ArrowLeft, ExternalLink, Calendar, CreditCard,
  MapPin, AlertCircle
} from 'lucide-vue-next'

const user = ref(null)
const orders = ref([])
const loading = ref(true)
const activeStatus = ref('all')
const selectedOrder = ref(null)
const showDetailModal = ref(false)
const route = useRoute()

const statuses = [
  { id: 'all', name: 'Semua', icon: Package },
  { id: 'dikemas', name: 'Dikemas', icon: Clock },
  { id: 'dikirim', name: 'Dikirim', icon: Truck },
  { id: 'selesai', name: 'Selesai', icon: CheckCircle2 },
  { id: 'batal', name: 'Dibatalkan', icon: XCircle },
]

async function fetchOrders() {
  if (!user.value) return
  loading.value = true
  try {
    const data = await $fetch('/api/orders/my', {
      params: { 
        user_id: user.value.id,
        status: activeStatus.value
      }
    })
    orders.value = data
  } catch (e) {
    showAlert('Gagal memuat pesanan', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('user_info')
    if (saved) {
      user.value = JSON.parse(saved)
      
      // Set status from query if exists
      if (route.query.status) {
        activeStatus.value = route.query.status
      }
      
      fetchOrders()
    } else {
      navigateTo('/auth/login')
    }
  }
})

watch(activeStatus, () => {
  fetchOrders()
})

const getStatusColor = (status) => {
  switch (status) {
    case 'dikemas': return 'text-orange-500 bg-orange-50 border-orange-100'
    case 'dikirim': return 'text-blue-500 bg-blue-50 border-blue-100'
    case 'selesai': return 'text-green-500 bg-green-50 border-green-100'
    case 'batal': return 'text-red-500 bg-red-50 border-red-100'
    default: return 'text-neutral-500 bg-neutral-50 border-neutral-100'
  }
}

function openDetail(order) {
  selectedOrder.value = order
  showDetailModal.value = true
}

const { showAlert, showConfirm } = useAlert()

async function cancelOrder(order) {
  showConfirm(
    'Apakah Anda yakin ingin membatalkan pesanan ini? Saldo akan dikembalikan secara otomatis ke dompet WardanaPay Anda.',
    async () => {
      try {
        await $fetch('/api/orders/cancel', {
          method: 'POST',
          body: { 
            order_id: order.id,
            user_id: user.value.id
          }
        })
        showAlert('Pesanan berhasil dibatalkan dan saldo telah dikembalikan', 'success', 'Berhasil')
        fetchOrders()
      } catch (e) {
        showAlert(e.data?.statusMessage || 'Gagal membatalkan pesanan', 'error', 'Error')
      }
    },
    'Konfirmasi Pembatalan'
  )
}

async function completeOrder(order) {
  showConfirm(
    'Apakah Anda yakin telah menerima pesanan ini dengan baik? Mengonfirmasi pesanan berarti transaksi telah selesai.',
    async () => {
      try {
        await $fetch('/api/orders/complete', {
          method: 'POST',
          body: { 
            order_id: order.id,
            user_id: user.value.id
          }
        })
        showAlert('Pesanan telah diselesaikan. Terima kasih!', 'success', 'Berhasil')
        fetchOrders()
      } catch (e) {
        showAlert(e.data?.statusMessage || 'Gagal menyelesaikan pesanan', 'error', 'Error')
      }
    },
    'Konfirmasi Pesanan Diterima'
  )
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 pt-32 pb-20">
    <div class="max-w-5xl mx-auto px-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div class="space-y-4">
          <ButtonBackButton label="Kembali" />
          <h1 class="text-4xl font-serif text-soft-black">Pesanan Saya</h1>
          <p class="text-xs text-muted uppercase tracking-[0.2em]">Lacak dan kelola riwayat belanja Anda</p>
        </div>

        <!-- Status Tabs -->
        <div class="flex bg-white p-1 border border-border shadow-sm overflow-x-auto no-scrollbar">
          <button 
            v-for="status in statuses" 
            :key="status.id"
            @click="activeStatus = status.id"
            class="px-6 py-3 text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap"
            :class="activeStatus === status.id ? 'bg-soft-black text-white' : 'text-muted hover:text-soft-black hover:bg-neutral-50'"
          >
            {{ status.name }}
          </button>
        </div>
      </div>

      <!-- Content -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 space-y-4">
        <div class="w-10 h-10 border-4 border-neutral-200 border-t-soft-black rounded-full animate-spin"></div>
        <p class="text-[10px] uppercase tracking-widest text-muted animate-pulse">Memuat data pesanan...</p>
      </div>

      <div v-else-if="orders.length === 0" class="flex flex-col items-center justify-center py-32 bg-white border border-border space-y-6">
        <div class="w-20 h-20 bg-neutral-50 flex items-center justify-center rounded-full">
          <ShoppingBag :size="32" class="text-neutral-300" />
        </div>
        <div class="text-center">
          <h2 class="text-lg font-serif mb-2">Belum ada pesanan</h2>
          <p class="text-xs text-muted">Sepertinya Anda belum memiliki pesanan dengan status ini.</p>
        </div>
        <NuxtLink to="/product/all" class="bg-soft-black text-white px-10 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-soft-black/10">
          Mulai Belanja
        </NuxtLink>
      </div>

      <div v-else class="space-y-8">
        <div v-for="order in orders" :key="order.id" class="bg-white border border-border overflow-hidden group hover:shadow-2xl hover:shadow-soft-black/5 transition-all duration-500">
          <!-- Order Header -->
          <div class="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-50/50">
            <div class="flex items-center gap-6">
              <div class="space-y-1">
                <p class="text-[9px] uppercase tracking-[0.2em] text-muted font-bold">Nomor Pesanan</p>
                <p class="text-xs font-bold text-soft-black tracking-widest">#{{ order.order_number }}</p>
              </div>
              <div class="w-px h-8 bg-border hidden sm:block"></div>
              <div class="space-y-1">
                <p class="text-[9px] uppercase tracking-[0.2em] text-muted font-bold">Tanggal</p>
                <p class="text-xs text-soft-black">{{ formatDate(order.created_at) }}</p>
              </div>
            </div>
            
            <div :class="getStatusColor(order.status)" class="px-4 py-2 border text-[9px] uppercase font-bold tracking-[0.2em]">
              {{ order.status }}
            </div>
          </div>

          <!-- Order Items Preview -->
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
              <!-- Items -->
              <div class="md:col-span-8 space-y-6">
                <div v-for="item in order.items" :key="item.id" class="flex gap-6">
                  <div class="w-20 h-28 bg-neutral-100 border border-border overflow-hidden flex-shrink-0">
                    <img :src="item.image" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div class="flex-1 space-y-2">
                    <h3 class="text-xs uppercase tracking-[0.15em] font-bold text-soft-black">{{ item.product_name }}</h3>
                    <p class="text-[9px] text-muted uppercase tracking-widest">{{ item.variant }} / {{ item.size }}</p>
                    <p class="text-[10px] text-muted">{{ item.quantity }} x Rp{{ item.price.toLocaleString('id-ID') }}</p>
                  </div>
                </div>
              </div>

              <!-- Summary -->
              <div class="md:col-span-4 border-l border-border pl-8 space-y-6 flex flex-col justify-between">
                <div class="space-y-4">
                  <div class="flex justify-between text-[10px] uppercase tracking-widest text-muted">
                    <span>Total Belanja</span>
                    <span class="font-bold text-soft-black">Rp{{ order.final_amount.toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex justify-between text-[10px] uppercase tracking-widest text-muted">
                    <span>Metode Bayar</span>
                    <span class="font-bold text-soft-black uppercase">{{ order.payment_method }}</span>
                  </div>
                </div>

                <div class="pt-4 border-t border-border space-y-3">
                  <button 
                    @click="openDetail(order)"
                    class="w-full py-4 border border-border text-[10px] uppercase tracking-widest font-bold hover:bg-soft-black hover:text-white transition-all flex items-center justify-center gap-3"
                  >
                    Detail Pesanan
                    <ChevronRight :size="12" />
                  </button>
                  <button 
                    v-if="order.status === 'dikemas'"
                    @click="cancelOrder(order)"
                    class="w-full py-4 border border-red-100 text-red-500 text-[10px] uppercase tracking-widest font-bold hover:bg-red-50 transition-all"
                  >
                    Batalkan Pesanan
                  </button>
                  <button 
                    v-if="order.status === 'dikirim'"
                    @click="completeOrder(order)"
                    class="w-full py-4 bg-soft-black text-white text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all"
                  >
                    Konfirmasi Selesai
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer/Shipping Note -->
          <div v-if="order.status === 'dikirim'" class="p-4 bg-blue-50/30 border-t border-blue-50 flex items-center gap-3">
            <Truck :size="14" class="text-blue-500" />
            <p class="text-[9px] text-blue-600 uppercase tracking-widest font-bold">Paket sedang dalam perjalanan ke alamat Anda</p>
          </div>
          <div v-if="order.status === 'batal' && order.statuses.find(s => s.description.includes('Dibatalkan oleh seller'))" class="p-4 bg-red-50 border-t border-red-100 flex items-center gap-3">
            <AlertCircle :size="14" class="text-red-500" />
            <p class="text-[9px] text-red-600 uppercase tracking-widest font-bold">
              {{ order.statuses.find(s => s.description.includes('Dibatalkan oleh seller')).description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Help Section -->
      <div class="mt-16 bg-white p-8 border border-border flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div class="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center">
            <AlertCircle :size="20" class="text-neutral-400" />
          </div>
          <div>
            <h4 class="text-sm font-bold text-soft-black">Ada masalah dengan pesanan Anda?</h4>
            <p class="text-[10px] text-muted uppercase tracking-widest mt-1">Tim dukungan kami siap membantu Anda menyelesaikan kendala.</p>
          </div>
        </div>
        <button class="px-8 py-4 bg-soft-black text-white text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all shadow-lg shadow-soft-black/10">
          Hubungi Bantuan
        </button>
      </div>
    </div>

    <!-- Order Detail Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDetailModal && selectedOrder" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-soft-black/80 backdrop-blur-md">
          <div class="bg-white w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" v-motion-slide-bottom>
            <!-- Modal Header -->
            <div class="p-8 border-b border-border flex justify-between items-center bg-neutral-50">
              <div class="space-y-1">
                <p class="text-[10px] uppercase tracking-[0.3em] font-bold text-muted">Detail Pesanan</p>
                <h3 class="text-2xl font-serif text-soft-black">#{{ selectedOrder.order_number }}</h3>
              </div>
              <button @click="showDetailModal = false" class="p-3 hover:bg-white border border-transparent hover:border-border transition-all rounded-full">
                <XCircle :size="24" class="text-neutral-400" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              <!-- Timeline / Tracking -->
              <section class="space-y-6">
                <h4 class="text-[10px] uppercase tracking-[0.2em] font-bold text-soft-black flex items-center gap-2">
                  <Package :size="14" /> Status Pengiriman
                </h4>
                <div class="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-neutral-200">
                  <div v-for="(status, idx) in selectedOrder.statuses" :key="status.id" class="relative">
                    <div class="absolute -left-[30px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                         :class="idx === 0 ? 'bg-soft-black scale-125' : 'bg-neutral-300'">
                    </div>
                    <div class="space-y-1">
                      <p class="text-xs font-bold uppercase tracking-widest" :class="idx === 0 ? 'text-soft-black' : 'text-muted'">
                        {{ status.status }}
                      </p>
                      <p class="text-[10px] text-muted">{{ status.description }}</p>
                      <p class="text-[9px] text-neutral-400 uppercase tracking-widest">{{ formatDate(status.created_at) }}</p>
                    </div>
                  </div>
                </div>

                <!-- Refund Alert -->
                <div v-if="selectedOrder.status === 'batal'" class="p-6 bg-red-50 border border-red-100 space-y-2">
                  <div class="flex items-center gap-2 text-red-600">
                    <CreditCard :size="16" />
                    <p class="text-[10px] uppercase tracking-widest font-bold">Informasi Pengembalian Dana</p>
                  </div>
                  <p class="text-xs text-red-700">Dana sebesar <span class="font-bold">Rp{{ selectedOrder.final_amount.toLocaleString() }}</span> telah dikembalikan ke saldo <span class="font-bold uppercase">WardanaPay</span> Anda.</p>
                </div>
              </section>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-border">
                <!-- Shipping Info -->
                <section class="space-y-4">
                  <h4 class="text-[10px] uppercase tracking-[0.2em] font-bold text-soft-black flex items-center gap-2">
                    <MapPin :size="14" /> Alamat Pengiriman
                  </h4>
                  <div class="bg-neutral-50 p-6 space-y-2 border border-border">
                    <p class="text-sm font-bold text-soft-black">{{ selectedOrder.recipient_name }}</p>
                    <p class="text-xs text-soft-black">{{ selectedOrder.phone }}</p>
                    <p class="text-xs text-muted leading-relaxed">{{ selectedOrder.full_address }}</p>
                  </div>
                </section>

                <!-- Payment Info -->
                <section class="space-y-4">
                  <h4 class="text-[10px] uppercase tracking-[0.2em] font-bold text-soft-black flex items-center gap-2">
                    <CreditCard :size="14" /> Rincian Pembayaran
                  </h4>
                  <div class="space-y-3 bg-neutral-50 p-6 border border-border">
                    <div class="flex justify-between text-[10px] uppercase tracking-widest text-muted">
                      <span>Metode Pembayaran</span>
                      <span class="font-bold text-soft-black">{{ selectedOrder.payment_method }}</span>
                    </div>
                    <div class="flex justify-between text-[10px] uppercase tracking-widest text-muted">
                      <span>Total Harga</span>
                      <span class="font-bold text-soft-black">Rp{{ (selectedOrder.final_amount - selectedOrder.shipping_fee + selectedOrder.discount_amount).toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between text-[10px] uppercase tracking-widest text-muted">
                      <span>Ongkos Kirim</span>
                      <span class="font-bold text-soft-black">Rp{{ selectedOrder.shipping_fee.toLocaleString() }}</span>
                    </div>
                    <div v-if="selectedOrder.discount_amount > 0" class="flex justify-between text-[10px] uppercase tracking-widest text-green-600">
                      <span>Diskon</span>
                      <span class="font-bold">-Rp{{ selectedOrder.discount_amount.toLocaleString() }}</span>
                    </div>
                    <div class="pt-3 border-t border-border flex justify-between items-end">
                      <span class="text-[11px] font-bold uppercase tracking-widest">Total Bayar</span>
                      <span class="text-lg font-serif text-soft-black">Rp{{ selectedOrder.final_amount.toLocaleString() }}</span>
                    </div>
                  </div>
                </section>
              </div>

              <!-- Item List -->
              <section class="space-y-6 pt-8 border-t border-border">
                <h4 class="text-[10px] uppercase tracking-[0.2em] font-bold text-soft-black flex items-center gap-2">
                  <ShoppingBag :size="14" /> Produk Yang Dibeli
                </h4>
                <div class="divide-y divide-border border border-border">
                  <div v-for="item in selectedOrder.items" :key="item.id" class="p-6 flex gap-6 hover:bg-neutral-50 transition-colors">
                    <div class="w-16 h-20 bg-neutral-100 border border-border overflow-hidden flex-shrink-0">
                      <img :src="item.image" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1 space-y-1">
                      <h5 class="text-[11px] font-bold uppercase tracking-widest text-soft-black">{{ item.product_name }}</h5>
                      <p class="text-[9px] text-muted uppercase tracking-widest">{{ item.variant }} / {{ item.size }}</p>
                      <div class="flex justify-between items-end pt-2">
                        <p class="text-[10px] text-muted">{{ item.quantity }} x Rp{{ item.price.toLocaleString() }}</p>
                        <p class="text-xs font-bold text-soft-black">Rp{{ (item.price * item.quantity).toLocaleString() }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <!-- Modal Footer -->
            <div class="p-8 border-t border-border bg-neutral-50 flex justify-end gap-4">
              <button 
                v-if="selectedOrder.status === 'dikemas'"
                @click="cancelOrder(selectedOrder); showDetailModal = false"
                class="px-10 py-4 border border-red-200 text-red-500 text-[10px] uppercase tracking-widest font-bold hover:bg-red-50 transition-all"
              >
                Batalkan Pesanan
              </button>
              <button 
                v-if="selectedOrder.status === 'dikirim'"
                @click="completeOrder(selectedOrder); showDetailModal = false"
                class="px-10 py-4 border border-soft-black text-soft-black text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-100 transition-all"
              >
                Konfirmasi Selesai
              </button>
              <button @click="showDetailModal = false" class="px-10 py-4 bg-soft-black text-white text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-soft-black/20">
                Tutup
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.text-soft-black { color: #1a1a1a; }
.bg-soft-black { background-color: #1a1a1a; }

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e5e5;
  border-radius: 10px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
