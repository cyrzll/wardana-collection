<script setup>
import { 
  ChevronLeft, MapPin, Ticket, CreditCard, 
  Check, X, ArrowRight, ShoppingBag, Truck,
  Loader2, Wallet, Lock, Eye, EyeOff, ShieldCheck
} from 'lucide-vue-next'

const user = ref(null)
const checkoutItems = ref([])
const myVouchers = ref([])
const selectedHargaVoucher = ref(null)
const selectedOngkirVoucher = ref(null)
const showVoucherModal = ref(false)
const shippingFee = ref(0)
const shippingOptions = ref([])
const selectedService = ref(null)
const calculatingShipping = ref(false)
const loading = ref(true)
const processingOrder = ref(false)
const walletBalance = ref(0)
const { showAlert } = useAlert()

// Payment & PIN State
const paymentMethod = ref('wardanapay')
const showPinModal = ref(false)
const orderPin = ref('')
const showPin = ref(false)

const addresses = ref([])
const selectedAddress = ref(null)

async function fetchData() {
  if (!user.value) return
  loading.value = true
  try {
    const [owned, addrData, walletData] = await Promise.all([
      $fetch('/api/vouchers/my', { params: { user_id: user.value.id } }),
      $fetch('/api/address', { params: { user_id: user.value.id } }),
      $fetch('/api/users/wallet', { params: { user_id: user.value.id } }).catch(() => null)
    ])
    myVouchers.value = Array.isArray(owned) ? owned.filter(v => !v.is_used) : []
    addresses.value = addrData || []
    walletBalance.value = walletData ? walletData.balance : 0
    
    // Auto select primary
    selectedAddress.value = addresses.value.find(a => a.is_primary) || addresses.value[0] || null
    if (selectedAddress.value) {
      getShippingCost()
    }
  } catch (e) {
    showAlert('Gagal memuat data', 'error')
  } finally {
    loading.value = false
  }
}

async function getShippingCost() {
  if (!selectedAddress.value) return
  
  calculatingShipping.value = true
  try {
    const res = await $fetch('/api/shipping/cost', {
      method: 'POST',
      body: {
        // District + City usually gives better results in RajaOngkir search
        destination_name: `${selectedAddress.value.district_name} ${selectedAddress.value.city_name}`,
        // Estimation: 500g per product
        weight: checkoutItems.value.reduce((acc, item) => acc + (item.quantity * 500), 0) || 1000,
        courier: 'jne'
      }
    })
    
    // Komerce response is already flattened in the .data array
    shippingOptions.value = Array.isArray(res.data) ? res.data : []
    
    if (shippingOptions.value.length > 0) {
      // Find the most reasonable service (usually REG)
      const reg = shippingOptions.value.find(s => s.service.includes('REG'))
      selectedService.value = reg || shippingOptions.value[0]
      // In Komerce, cost is often a single value or array. Docs say data[].cost
      const rawCost = selectedService.value.cost
      shippingFee.value = Array.isArray(rawCost) ? rawCost[0].value : (typeof rawCost === 'number' ? rawCost : (rawCost?.value || 0))
    } else {
      shippingFee.value = 0
    }
  } catch (e) {
    showAlert('Gagal menghitung ongkos kirim', 'error')
    shippingFee.value = 0
  } finally {
    calculatingShipping.value = false
  }
}

function getCostValue(cost) {
  if (Array.isArray(cost)) return cost[0]?.value || 0
  if (typeof cost === 'number') return cost
  return cost?.value || 0
}

watch(selectedAddress, (newAddr) => {
  if (newAddr) getShippingCost()
})

watch(selectedService, (newService) => {
  if (newService) {
    shippingFee.value = getCostValue(newService.cost)
  }
})

onMounted(() => {
  if (import.meta.client) {
    const savedUser = localStorage.getItem('user_info')
    const items = localStorage.getItem('checkout_items')
    
    if (savedUser && items) {
      user.value = JSON.parse(savedUser)
      checkoutItems.value = JSON.parse(items)
      fetchData()
    } else if (!savedUser) {
      navigateTo('/auth/login', { replace: true })
    } else {
      navigateTo('/user/my/cart', { replace: true })
    }
  }
})

const subtotal = computed(() => {
  return checkoutItems.value.reduce((acc, item) => acc + (item.price * item.quantity), 0)
})

const hargaDiscount = computed(() => {
  if (!selectedHargaVoucher.value) return 0
  const v = selectedHargaVoucher.value
  if (subtotal.value < v.min_purchase) return 0
  
  if (v.discount_type === 'percent') {
    return subtotal.value * (v.discount_value / 100)
  }
  return v.discount_value
})

const ongkirDiscount = computed(() => {
  if (!selectedOngkirVoucher.value) return 0
  const v = selectedOngkirVoucher.value
  if (subtotal.value < v.min_purchase) return 0
  return Math.min(shippingFee.value, v.discount_value || shippingFee.value)
})

const total = computed(() => {
  return subtotal.value + (shippingFee.value - ongkirDiscount.value) - hargaDiscount.value
})

function applyVoucher(v) {
  if (v.type === 'harga') {
    if (selectedHargaVoucher.value?.id === v.id) selectedHargaVoucher.value = null
    else selectedHargaVoucher.value = v
  } else {
    if (selectedOngkirVoucher.value?.id === v.id) selectedOngkirVoucher.value = null
    else selectedOngkirVoucher.value = v
  }
}

async function placeOrder() {
  if (!selectedAddress.value) {
    showAlert('Pilih alamat pengiriman terlebih dahulu', 'error')
    return
  }
  if (!selectedService.value) {
    showAlert('Pilih metode pengiriman terlebih dahulu', 'error')
    return
  }

  if (paymentMethod.value === 'wardanapay') {
    showPinModal.value = true
  } else {
    handleFinalCheckout()
  }
}

async function handleFinalCheckout() {
  processingOrder.value = true
  try {
    const voucherIds = []
    if (selectedHargaVoucher.value) voucherIds.push(selectedHargaVoucher.value.id)
    if (selectedOngkirVoucher.value) voucherIds.push(selectedOngkirVoucher.value.id)

    const fullAddress = `${selectedAddress.value.street_address}, ${selectedAddress.value.village_name}, ${selectedAddress.value.district_name}, ${selectedAddress.value.city_name}, ${selectedAddress.value.province_name} ${selectedAddress.value.postal_code}`

    await $fetch('/api/orders', {
      method: 'POST',
      body: {
        user_id: user.value.id,
        items: checkoutItems.value,
        shipping_fee: shippingFee.value,
        harga_discount: hargaDiscount.value,
        ongkir_discount: ongkirDiscount.value,
        final_amount: total.value,
        recipient_name: selectedAddress.value.recipient_name,
        phone: selectedAddress.value.phone,
        full_address: fullAddress,
        payment_method: paymentMethod.value,
        pin: orderPin.value,
        voucher_ids: voucherIds
      }
    })

    showAlert('Pesanan berhasil dibuat!', 'success')
    localStorage.removeItem('checkout_items')
    showPinModal.value = false
    navigateTo('/user/my/orders')
  } catch (e) {
    showAlert(e.data?.statusMessage || 'Gagal memproses pesanan', 'error')
  } finally {
    processingOrder.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 pt-32 pb-20">
    <div class="max-w-7xl mx-auto px-6">
      <!-- Header -->
      <div class="flex flex-col gap-8 mb-12">
        <ButtonBackButton label="Kembali ke Tas" to="/user/my/cart" />
        <h1 class="text-4xl font-serif text-soft-black">Checkout</h1>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <!-- Main Content -->
        <div class="lg:col-span-8 space-y-8">
          <!-- Shipping Address -->
          <section class="bg-white p-6 md:p-8 border border-border space-y-6">
            <div class="flex items-center justify-between border-b border-border pb-4">
              <h2 class="text-xs uppercase tracking-[0.2em] font-bold flex items-center gap-3">
                <MapPin :size="18" />
                Alamat Pengiriman
              </h2>
              <NuxtLink to="/user/my/address" class="text-[10px] uppercase font-bold text-muted hover:text-soft-black underline">
                {{ selectedAddress ? 'Ubah Alamat' : 'Tambah Alamat' }}
              </NuxtLink>
            </div>
            
            <div v-if="selectedAddress" class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-soft-black">{{ selectedAddress.recipient_name }}</span>
                <span class="text-xs text-muted">({{ selectedAddress.label }})</span>
              </div>
              <p class="text-sm text-soft-black">{{ selectedAddress.phone }}</p>
              <p class="text-sm text-muted leading-relaxed">
                {{ selectedAddress.street_address }}<br />
                {{ selectedAddress.village_name }}, {{ selectedAddress.district_name }}<br />
                {{ selectedAddress.city_name }}, {{ selectedAddress.province_name }} {{ selectedAddress.postal_code }}
              </p>
            </div>
            <div v-else class="py-4 text-center border border-dashed border-border">
              <p class="text-xs text-muted">Belum ada alamat pengiriman terpilih.</p>
              <NuxtLink to="/user/my/address" class="text-[10px] uppercase font-bold text-soft-black mt-2 inline-block underline">Tambah Alamat Sekarang</NuxtLink>
            </div>
          </section>

          <!-- Shipping Method -->
          <section class="bg-white p-6 md:p-8 border border-border space-y-6">
            <div class="flex items-center justify-between border-b border-border pb-4">
              <h2 class="text-xs uppercase tracking-[0.2em] font-bold flex items-center gap-3">
                <Truck :size="18" />
                Metode Pengiriman
              </h2>
              <span v-if="calculatingShipping" class="flex items-center gap-2 text-[10px] text-muted uppercase font-bold">
                <Loader2 :size="12" class="animate-spin" />
                Menghitung...
              </span>
            </div>

            <div v-if="shippingOptions.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label 
                v-for="service in shippingOptions" 
                :key="service.service"
                class="relative border p-4 cursor-pointer transition-all hover:bg-neutral-50"
                :class="selectedService?.service === service.service ? 'border-soft-black ring-1 ring-soft-black' : 'border-border'"
              >
                <input 
                  type="radio" 
                  name="shipping" 
                  :value="service" 
                  v-model="selectedService"
                  class="sr-only"
                />
                <div class="flex justify-between items-start mb-2">
                  <span class="text-[11px] font-bold uppercase tracking-widest text-soft-black">{{ service.name }} - {{ service.service }}</span>
                  <span class="text-xs font-bold text-soft-black">Rp{{ getCostValue(service.cost).toLocaleString() }}</span>
                </div>
                <p class="text-[10px] text-muted">{{ service.description }}</p>
                <p class="text-[10px] text-muted mt-1 italic">Estimasi: {{ (service.cost[0]?.etd || service.etd || '').toLowerCase().replace(/days?/, '').trim() }} Hari</p>
              </label>
            </div>
            <div v-else-if="!calculatingShipping && selectedAddress" class="py-6 text-center border border-dashed border-border">
              <p class="text-[10px] text-muted uppercase tracking-widest">Maaf, tidak ada layanan pengiriman tersedia untuk alamat ini.</p>
            </div>
            <div v-else-if="!selectedAddress" class="py-6 text-center border border-dashed border-border opacity-50">
              <p class="text-[10px] text-muted uppercase tracking-widest">Pilih alamat untuk melihat ongkos kirim.</p>
            </div>
          </section>

          <!-- Selected Products -->
          <section class="bg-white p-6 md:p-8 border border-border space-y-8">
            <h2 class="text-xs uppercase tracking-[0.2em] font-bold flex items-center gap-3 border-b border-border pb-4">
              <ShoppingBag :size="18" />
              Rincian Produk
            </h2>
            
            <div class="divide-y divide-border">
              <div v-for="item in checkoutItems" :key="item.id" class="flex gap-6 py-6 first:pt-0 last:pb-0 group">
                <div class="w-20 h-28 bg-neutral-100 border border-border flex-shrink-0">
                  <img :src="item.image" class="w-full h-full object-cover" />
                </div>
                <div class="flex-1">
                  <h3 class="text-xs uppercase tracking-[0.15em] font-bold text-soft-black">{{ item.name }}</h3>
                  <p class="text-[9px] text-muted uppercase tracking-widest mt-1">{{ item.variant }} / {{ item.size }}</p>
                  <div class="mt-4 flex justify-between items-end">
                    <p class="text-xs text-muted">{{ item.quantity }} x Rp{{ item.price.toLocaleString('id-ID') }}</p>
                    <p class="text-sm font-bold text-soft-black">Rp{{ (item.price * item.quantity).toLocaleString('id-ID') }}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Payment Method -->
          <section class="bg-white p-6 md:p-8 border border-border space-y-6">
            <h2 class="text-xs uppercase tracking-[0.2em] font-bold flex items-center gap-3 border-b border-border pb-4">
              <CreditCard :size="18" />
              Metode Pembayaran
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label 
                class="relative border p-6 cursor-pointer transition-all hover:bg-neutral-50"
                :class="paymentMethod === 'wardanapay' ? 'border-soft-black ring-1 ring-soft-black' : 'border-border opacity-60'"
              >
                <input type="radio" v-model="paymentMethod" value="wardanapay" class="sr-only" />
                <div class="flex items-center gap-4">
                  <div class="p-3 bg-neutral-100 rounded">
                    <Wallet :size="20" class="text-soft-black" />
                  </div>
                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-widest">WardanaPay</p>
                    <p class="text-[9px] mt-1" :class="walletBalance < total ? 'text-red-500' : 'text-muted'">
                      Saldo: <span class="font-bold">Rp{{ walletBalance.toLocaleString('id-ID') }}</span>
                    </p>
                    <p v-if="walletBalance < total" class="text-[8px] text-red-500 mt-0.5 uppercase tracking-widest font-bold">Saldo tidak mencukupi</p>
                  </div>
                </div>
                <div v-if="paymentMethod === 'wardanapay'" class="absolute top-4 right-4 text-soft-black">
                  <Check :size="16" />
                </div>
              </label>

              <div class="relative border p-6 border-dashed border-border opacity-40 cursor-not-allowed">
                <div class="flex items-center gap-4">
                  <div class="p-3 bg-neutral-100 rounded">
                    <CreditCard :size="20" class="text-soft-black" />
                  </div>
                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-widest text-muted">Metode Lain</p>
                    <p class="text-[9px] text-muted">Segera hadir</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Sidebar Summary -->
        <div class="lg:col-span-4 space-y-6">
          <!-- Voucher Selection -->
          <div class="bg-white border border-border p-6 shadow-sm">
            <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold mb-4 flex items-center gap-2">
              <Ticket :size="14" />
              Voucher & Promo
            </h3>
            
            <div v-if="selectedHargaVoucher || selectedOngkirVoucher" class="space-y-2 mb-4">
              <div v-if="selectedHargaVoucher" class="flex items-center justify-between p-3 bg-neutral-50 border border-soft-black/20 text-[10px]">
                <span class="font-bold truncate">{{ selectedHargaVoucher.code }} (Potongan Harga)</span>
                <button @click="selectedHargaVoucher = null" class="text-muted hover:text-soft-black"><X :size="12" /></button>
              </div>
              <div v-if="selectedOngkirVoucher" class="flex items-center justify-between p-3 bg-neutral-50 border border-soft-black/20 text-[10px]">
                <span class="font-bold truncate">{{ selectedOngkirVoucher.code }} (Potongan Ongkir)</span>
                <button @click="selectedOngkirVoucher = null" class="text-muted hover:text-soft-black"><X :size="12" /></button>
              </div>
            </div>

            <button @click="showVoucherModal = true" class="w-full py-4 bg-neutral-50 border border-dashed border-border text-[10px] uppercase tracking-widest font-bold hover:border-soft-black transition-all">
              {{ selectedHargaVoucher || selectedOngkirVoucher ? 'Ubah Voucher' : 'Gunakan Voucher' }}
            </button>
          </div>

          <!-- Final Summary -->
          <div class="bg-neutral-100 p-6 md:p-8 border border-border text-soft-black shadow-sm sticky top-32">
            <h2 class="text-xs uppercase tracking-[0.2em] font-bold mb-8 pb-4 border-b border-border">Ringkasan Pembayaran</h2>
            
            <div class="space-y-4 mb-8">
              <div class="flex justify-between text-[10px] uppercase tracking-widest text-muted">
                <span>Subtotal Produk</span>
                <span class="font-bold text-soft-black">Rp{{ subtotal.toLocaleString('id-ID') }}</span>
              </div>
              
              <div v-if="hargaDiscount > 0" class="flex justify-between text-[10px] uppercase tracking-widest text-green-600">
                <span>Diskon Voucher</span>
                <span class="font-bold">-Rp{{ hargaDiscount.toLocaleString('id-ID') }}</span>
              </div>

              <div class="flex justify-between text-[10px] uppercase tracking-widest text-muted">
                <span>Biaya Pengiriman</span>
                <div class="text-right">
                  <p :class="ongkirDiscount > 0 ? 'line-through text-neutral-400' : 'font-bold text-soft-black'">Rp{{ shippingFee.toLocaleString('id-ID') }}</p>
                  <p v-if="ongkirDiscount > 0" class="font-bold text-green-600">Gratis</p>
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-border mb-10">
              <div class="flex justify-between items-end">
                <span class="text-xs uppercase tracking-[0.2em] font-bold">Total Tagihan</span>
                <span class="text-3xl font-serif">Rp{{ total.toLocaleString('id-ID') }}</span>
              </div>
            </div>

            <button 
              @click="placeOrder" 
              :disabled="processingOrder || !selectedAddress || !selectedService || (paymentMethod === 'wardanapay' && walletBalance < total)"
              class="w-full bg-soft-black text-white py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-neutral-800 disabled:bg-neutral-200 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-xl shadow-soft-black/20"
            >
              <Loader2 v-if="processingOrder" :size="16" class="animate-spin" />
              <template v-else>
                Bayar Sekarang
                <ArrowRight :size="16" />
              </template>
            </button>

            <div class="mt-6 flex items-center justify-center gap-2 text-muted">
              <CreditCard :size="12" />
              <span class="text-[8px] uppercase tracking-[0.2em]">Pembayaran Aman</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Voucher Selection Modal -->
    <Transition name="fade">
      <div v-if="showVoucherModal" class="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-soft-black/40 backdrop-blur-md">
        <div class="bg-white w-full max-w-md shadow-2xl border border-border flex flex-col max-h-[80vh]">
          <div class="p-6 border-b border-border flex justify-between items-center">
            <h2 class="text-sm font-serif uppercase tracking-widest text-soft-black">Pilih Voucher</h2>
            <button @click="showVoucherModal = false" class="p-2 hover:bg-neutral-100 rounded-full transition-all">
              <X :size="18" />
            </button>
          </div>

          <div class="p-6 overflow-y-auto space-y-4 custom-scrollbar">
            <div v-if="myVouchers.length === 0" class="py-12 text-center">
              <Ticket :size="32" class="mx-auto text-neutral-200 mb-4" />
              <p class="text-xs text-muted italic">Belum ada voucher yang dapat digunakan.</p>
            </div>
            
            <div v-for="v in myVouchers" :key="v.id" 
              @click="applyVoucher(v)"
              :class="[
                (selectedHargaVoucher?.id === v.id || selectedOngkirVoucher?.id === v.id) ? 'border-soft-black bg-neutral-50 shadow-md' : 'border-border hover:bg-neutral-50',
                subtotal < v.min_purchase ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'
              ]"
              class="border p-5 transition-all relative group"
            >
              <div v-if="selectedHargaVoucher?.id === v.id || selectedOngkirVoucher?.id === v.id" class="absolute top-4 right-4">
                <Check :size="16" class="text-soft-black" />
              </div>
              
              <div class="space-y-1">
                <p class="text-[9px] uppercase tracking-[0.2em] font-bold text-muted group-hover:text-soft-black transition-colors">{{ v.code }}</p>
                <p class="text-xs font-bold text-soft-black">{{ v.title }}</p>
                <p class="text-[10px] text-muted mt-2">Min. Belanja: Rp{{ v.min_purchase.toLocaleString() }}</p>
                
                <div class="pt-4 flex justify-between items-end border-t border-dashed border-border mt-4">
                  <span class="px-2 py-1 bg-neutral-100 text-[8px] uppercase font-bold rounded tracking-widest">
                    {{ v.type === 'harga' ? 'Potongan Harga' : 'Potongan Ongkir' }}
                  </span>
                  <p class="text-sm font-bold text-soft-black">
                    {{ v.discount_type === 'percent' ? v.discount_value + '%' : 'Rp' + v.discount_value.toLocaleString() }}
                  </p>
                </div>
              </div>
              
              <div v-if="subtotal < v.min_purchase" class="mt-3 text-[9px] text-red-500 font-bold uppercase tracking-widest">
                Kurang Rp{{ (v.min_purchase - subtotal).toLocaleString() }} lagi
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-border">
            <button @click="showVoucherModal = false" class="w-full bg-soft-black text-white py-5 text-[10px] uppercase tracking-[0.3em] font-bold shadow-xl shadow-soft-black/20">
              Selesai
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- PIN Verification Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showPinModal" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-soft-black/80 backdrop-blur-md">
          <div class="bg-white w-full max-w-md shadow-2xl p-10 space-y-8 relative overflow-hidden" v-motion-pop>
            <div class="absolute top-0 left-0 w-full h-1 bg-neutral-100">
              <div v-if="processingOrder" class="h-full bg-soft-black animate-progress"></div>
            </div>

            <div class="text-center space-y-2">
              <div class="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock :size="24" class="text-soft-black" />
              </div>
              <h3 class="text-2xl font-serif text-soft-black">Konfirmasi Pembayaran</h3>
              <p class="text-xs text-muted leading-relaxed px-4">Masukkan 6 digit PIN WardanaPay Anda untuk menyelesaikan transaksi ini.</p>
            </div>

            <div class="space-y-6">
              <div class="relative">
                <input 
                  v-model="orderPin"
                  :type="showPin ? 'text' : 'password'" 
                  maxlength="6"
                  placeholder="000000"
                  class="w-full text-center text-3xl tracking-[0.5em] font-mono border-b-2 border-neutral-200 py-4 focus:outline-none focus:border-soft-black transition-colors"
                  :disabled="processingOrder"
                />
                <button 
                  @click="showPin = !showPin"
                  class="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-soft-black transition-colors"
                >
                  <Eye v-if="!showPin" :size="20" />
                  <EyeOff v-else :size="20" />
                </button>
              </div>

              <div class="pt-4 flex gap-4">
                <button 
                  @click="showPinModal = false"
                  :disabled="processingOrder"
                  class="flex-1 py-5 border border-border text-[11px] uppercase tracking-widest font-bold hover:bg-neutral-50 transition-all"
                >
                  Batal
                </button>
                <button 
                  @click="handleFinalCheckout"
                  :disabled="processingOrder || orderPin.length !== 6"
                  class="flex-[2] py-5 bg-soft-black text-white text-[11px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-soft-black/10"
                >
                  <Loader2 v-if="processingOrder" :size="16" class="animate-spin mx-auto" />
                  <span v-else>Bayar Sekarang</span>
                </button>
              </div>

              <p class="text-[9px] text-center text-muted flex items-center justify-center gap-2">
                <ShieldCheck :size="10" />
                Transaksi ini dilindungi oleh WardanaPay Security System
              </p>
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

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
