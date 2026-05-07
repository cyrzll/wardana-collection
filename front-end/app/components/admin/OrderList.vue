<script setup>
import { 
  ShoppingBag, Search, Package, Truck, 
  CheckCircle2, XCircle, MoreVertical, 
  Eye, Trash2, Clock, MapPin, CreditCard,
  User, ChevronRight, Loader2, AlertTriangle
} from 'lucide-vue-next'

const props = defineProps({
  status: { type: String, default: 'semua' }
})

const orders = ref([])
const loading = ref(true)
const search = ref('')
const { showAlert, showConfirm } = useAlert()

// Detail Modal States
const showDetailModal = ref(false)
const orderDetail = ref(null)

function openDetailModal(order) {
  orderDetail.value = order
  showDetailModal.value = true
}

// Cancel Order Modal States
const showCancelModal = ref(false)
const selectedOrder = ref(null)
const cancelReason = ref('')
const cancelling = ref(false)

async function fetchOrders() {
  loading.value = true
  try {
    const data = await $fetch('/api/admin/orders', {
      params: { status: props.status }
    })
    orders.value = Array.isArray(data) ? data : []
  } catch (e) {
    showAlert('Gagal memuat pesanan', 'error')
    orders.value = []
  } finally {
    loading.value = false
  }
}

const filteredOrders = computed(() => {
  if (!search.value) return orders.value || []
  const s = search.value.toLowerCase()
  return (orders.value || []).filter(o => 
    (o?.order_number || '').toLowerCase().includes(s) || 
    (o?.user?.username || '').toLowerCase().includes(s) ||
    (o?.recipient_name || '').toLowerCase().includes(s)
  )
})

onMounted(fetchOrders)

function getStatusColor(status) {
  switch (status) {
    case 'dikemas': return 'border-orange-200 bg-orange-50 text-orange-700'
    case 'dikirim': return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'selesai': return 'border-green-200 bg-green-50 text-green-700'
    case 'batal': return 'border-red-200 bg-red-50 text-red-700'
    default: return 'border-neutral-200 bg-neutral-50 text-neutral-700'
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function openCancelModal(order) {
  selectedOrder.value = order
  cancelReason.value = ''
  showCancelModal.value = true
}

async function handleCancelOrder() {
  if (!cancelReason.value) {
    showAlert('Alasan pembatalan harus diisi', 'warning')
    return
  }

  cancelling.value = true
  try {
    await $fetch('/api/admin/orders/cancel', {
      method: 'POST',
      body: { 
        order_id: selectedOrder.value.id,
        reason: cancelReason.value
      }
    })
    showAlert('Pesanan berhasil dibatalkan dan saldo dikembalikan', 'success')
    showCancelModal.value = false
    await fetchOrders()
  } catch (e) {
    showAlert(e.data?.statusMessage || 'Gagal membatalkan pesanan', 'error')
  } finally {
    cancelling.value = false
  }
}

async function updateStatus(order, newStatus) {
  showConfirm(
    `Ubah status pesanan #${order.order_number} menjadi ${newStatus}?`,
    async () => {
      try {
        await $fetch(`/api/admin/orders/status`, {
          method: 'PUT',
          body: { order_id: order.id, status: newStatus }
        })
        showAlert('Status pesanan berhasil diperbarui', 'success')
        await fetchOrders()
      } catch (e) {
        showAlert('Gagal memperbarui status', 'error')
      }
    },
    'Perbarui Status'
  )
}
</script>

<template>
  <div class="space-y-8">
    <!-- Search -->
    <div class="relative">
      <input 
        v-model="search"
        type="text" 
        placeholder="Cari nomor pesanan, nama pembeli..." 
        class="w-full bg-white border border-border px-12 py-4 text-sm focus:border-soft-black outline-none transition-all shadow-sm"
      />
      <Search :size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
    </div>

    <!-- Orders Table/List -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-32 space-y-4">
      <div class="w-10 h-10 border-4 border-neutral-200 border-t-soft-black rounded-full animate-spin"></div>
      <p class="text-[10px] uppercase tracking-widest text-muted">Memuat data pesanan...</p>
    </div>

    <div v-else-if="filteredOrders.length === 0" class="bg-white border border-border py-32 text-center space-y-4">
      <Package :size="48" class="mx-auto text-neutral-200" />
      <p class="text-sm text-muted font-serif">Tidak ada pesanan yang ditemukan</p>
    </div>

    <div v-else class="bg-white border border-border overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-neutral-50 border-b border-border">
            <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold">Informasi Pesanan</th>
            <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold">Pembeli</th>
            <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-center">Produk</th>
            <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-right">Total</th>
            <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-center">Status</th>
            <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-neutral-50/50 transition-colors group">
            <td class="px-8 py-6">
              <div class="space-y-1">
                <p class="text-xs font-bold text-soft-black tracking-widest uppercase">#{{ order.order_number }}</p>
                <p class="text-[10px] text-muted tracking-widest">{{ formatDate(order.created_at) }}</p>
              </div>
            </td>
            <td class="px-8 py-6">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center border border-border">
                  <User :size="14" class="text-neutral-400" />
                </div>
                <div>
                  <p class="text-xs font-bold text-soft-black">{{ order.recipient_name }}</p>
                  <p class="text-[10px] text-muted">{{ order.phone }}</p>
                </div>
              </div>
            </td>
            <td class="px-8 py-6 text-center">
              <span class="text-xs font-bold bg-neutral-100 px-3 py-1 border border-border">{{ order.items?.length || 0 }} Items</span>
            </td>
            <td class="px-8 py-6 text-right">
              <p class="text-xs font-bold text-soft-black">Rp{{ (order.final_amount || 0).toLocaleString() }}</p>
              <p class="text-[9px] text-muted uppercase tracking-widest">{{ order.payment_method || 'Manual' }}</p>
            </td>
            <td class="px-8 py-6 text-center">
              <span 
                class="px-3 py-1.5 border text-[9px] font-bold uppercase tracking-widest inline-block min-w-[100px]"
                :class="getStatusColor(order.status)"
              >
                {{ order.status }}
              </span>
            </td>
            <td class="px-8 py-6 text-right">
              <div class="flex items-center justify-end gap-2">
                <button v-if="order.status === 'dikemas'" @click="updateStatus(order, 'dikirim')" class="p-2 hover:bg-blue-50 text-blue-600 transition-colors" title="Kirim Pesanan">
                  <Truck :size="16" />
                </button>
                <button v-if="order.status === 'dikirim'" @click="updateStatus(order, 'selesai')" class="p-2 hover:bg-green-50 text-green-600 transition-colors" title="Selesaikan Pesanan">
                  <CheckCircle2 :size="16" />
                </button>
                <button v-if="order.status === 'dikemas'" @click="openCancelModal(order)" class="p-2 hover:bg-red-50 text-red-600 transition-colors" title="Batalkan Pesanan">
                  <XCircle :size="16" />
                </button>
                <button @click="openDetailModal(order)" class="p-2 hover:bg-neutral-100 text-soft-black transition-colors" title="Detail Pesanan">
                  <Eye :size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Order Detail Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDetailModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div class="absolute inset-0 bg-soft-black/40 backdrop-blur-sm" @click="showDetailModal = false"></div>
          <div class="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col border border-border shadow-2xl" v-motion-fade>
            <!-- Modal Header -->
            <div class="p-8 border-b border-border flex items-center justify-between bg-neutral-50">
              <div>
                <div class="flex items-center gap-3 mb-1">
                  <h3 class="text-2xl font-serif text-soft-black">Detail Pesanan</h3>
                  <span 
                    class="px-3 py-1 border text-[9px] font-bold uppercase tracking-widest"
                    :class="getStatusColor(orderDetail.status)"
                  >
                    {{ orderDetail.status }}
                  </span>
                </div>
                <p class="text-xs text-muted tracking-widest uppercase">#{{ orderDetail.order_number }} • {{ formatDate(orderDetail.created_at) }}</p>
              </div>
              <button @click="showDetailModal = false" class="p-2 hover:bg-neutral-200 rounded-full transition-colors">
                <XCircle :size="24" class="text-soft-black" />
              </button>
            </div>

            <!-- Modal Content -->
            <div class="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                <!-- Customer & Shipping Info -->
                <div class="space-y-8">
                  <div class="space-y-4">
                    <h4 class="text-[10px] uppercase tracking-[0.2em] font-bold text-muted border-b border-border pb-2">Informasi Pembeli</h4>
                    <div class="flex items-start gap-4">
                      <div class="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center border border-border shrink-0">
                        <User :size="18" class="text-neutral-400" />
                      </div>
                      <div>
                        <p class="text-sm font-bold text-soft-black">{{ orderDetail.recipient_name }}</p>
                        <p class="text-xs text-muted">{{ orderDetail.user.email }}</p>
                        <p class="text-xs text-muted mt-1">{{ orderDetail.phone }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <h4 class="text-[10px] uppercase tracking-[0.2em] font-bold text-muted border-b border-border pb-2">Alamat Pengiriman</h4>
                    <div class="flex items-start gap-4 text-soft-black">
                      <MapPin :size="18" class="text-neutral-400 shrink-0 mt-1" />
                      <p class="text-xs leading-relaxed">{{ orderDetail.address_detail }}</p>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <h4 class="text-[10px] uppercase tracking-[0.2em] font-bold text-muted border-b border-border pb-2">Metode Pembayaran</h4>
                    <div class="flex items-start gap-4 text-soft-black">
                      <CreditCard :size="18" class="text-neutral-400 shrink-0 mt-1" />
                      <div>
                        <p class="text-xs font-bold uppercase tracking-wider">{{ orderDetail.payment_method }}</p>
                        <p class="text-[10px] text-muted mt-1">Status: Terbayar Otomatis</p>
                      </div>
                    </div>
                  </div>

                  <div v-if="orderDetail.cancel_reason" class="p-4 bg-red-50 border border-red-100 space-y-2">
                    <p class="text-[9px] uppercase tracking-widest font-bold text-red-600">Alasan Pembatalan</p>
                    <p class="text-xs text-red-700 italic">"{{ orderDetail.cancel_reason }}"</p>
                  </div>
                </div>

                <!-- Order Items -->
                <div class="space-y-6">
                  <h4 class="text-[10px] uppercase tracking-[0.2em] font-bold text-muted border-b border-border pb-2">Item Pesanan</h4>
                  <div class="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                    <div v-for="(item, idx) in orderDetail.items" :key="idx" class="flex gap-4 p-3 border border-border bg-neutral-50/30">
                      <div class="w-16 h-16 bg-white border border-border overflow-hidden shrink-0">
                        <img :src="item.image" class="w-full h-full object-cover" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-soft-black truncate">{{ item.name }}</p>
                        <p class="text-[10px] text-muted mt-0.5">Varian: {{ item.variant }} | Ukuran: {{ item.size }}</p>
                        <div class="flex justify-between items-end mt-2">
                          <p class="text-[10px] text-muted">{{ item.quantity }}x Rp{{ item.price.toLocaleString() }}</p>
                          <p class="text-xs font-bold text-soft-black">Rp{{ (item.price * item.quantity).toLocaleString() }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Price Breakdown -->
                  <div class="bg-neutral-50 p-6 space-y-3 border border-border">
                    <div class="flex justify-between text-[10px] text-muted uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span>Rp{{ (orderDetail.total_amount || 0).toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between text-[10px] text-muted uppercase tracking-widest">
                      <span>Ongkos Kirim</span>
                      <span>Rp{{ (orderDetail.shipping_cost || 0).toLocaleString() }}</span>
                    </div>
                    <div v-if="orderDetail.discount_amount" class="flex justify-between text-[10px] text-red-600 uppercase tracking-widest">
                      <span>Diskon Voucher</span>
                      <span>-Rp{{ (orderDetail.discount_amount || 0).toLocaleString() }}</span>
                    </div>
                    <div class="pt-3 border-t border-border flex justify-between items-center">
                      <span class="text-[11px] font-bold text-soft-black uppercase tracking-[0.2em]">Total Pembayaran</span>
                      <span class="text-lg font-serif text-soft-black">Rp{{ (orderDetail.final_amount || 0).toLocaleString() }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="p-8 border-t border-border flex justify-end gap-4 bg-neutral-50">
              <button @click="showDetailModal = false" class="px-8 py-3 border border-border text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-200 transition-all">
                Tutup
              </button>
              <button 
                v-if="orderDetail.status === 'dikemas'"
                @click="updateStatus(orderDetail, 'dikirim'); showDetailModal = false" 
                class="px-8 py-3 bg-soft-black text-white text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all flex items-center gap-2"
              >
                <Truck :size="14" /> Kirim Sekarang
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Admin Cancel Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCancelModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div class="absolute inset-0 bg-soft-black/40 backdrop-blur-sm" @click="showCancelModal = false"></div>
          <div class="bg-white w-full max-w-md relative z-10 p-10 border border-border shadow-2xl space-y-8" v-motion-pop>
            <div class="text-center space-y-4">
              <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle :size="32" />
              </div>
              <h3 class="text-2xl font-serif text-soft-black">Batalkan Pesanan</h3>
              <p class="text-sm text-muted">Anda akan membatalkan pesanan <span class="font-bold text-soft-black">#{{ selectedOrder?.order_number }}</span>. Saldo akan otomatis dikembalikan ke pembeli.</p>
            </div>

            <div class="space-y-4">
              <label class="text-[10px] uppercase tracking-widest font-bold text-muted">Alasan Pembatalan</label>
              <textarea 
                v-model="cancelReason" 
                rows="4"
                placeholder="Contoh: Stok produk habis..."
                class="w-full border border-border p-4 text-sm focus:border-soft-black outline-none transition-all resize-none"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-4">
              <button @click="showCancelModal = false" class="py-4 border border-border text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-50 transition-all">
                Tutup
              </button>
              <button 
                @click="handleCancelOrder" 
                :disabled="cancelling"
                class="py-4 bg-red-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-2"
              >
                <Loader2 v-if="cancelling" :size="14" class="animate-spin" />
                Konfirmasi Batal
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
