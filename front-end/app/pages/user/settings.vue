<script setup>
import { 
  User, Mail, Ticket, Heart, ShoppingBag, 
  Package, ChevronRight, Camera, Settings, 
  LogOut, Bell, Shield, CreditCard, MapPin,
  Truck, CheckCircle2, RefreshCcw, Box
} from 'lucide-vue-next'

const user = ref(null)
const loading = ref(true)
const { showAlert } = useAlert()
const voucherCount = ref(0)
const orderCount = ref(0)
const wishlistCount = ref(0)
const walletBalance = ref(0)

async function fetchStats() {
  if (!user.value) return
  try {
    const [vouchers, orders, wishlist, wallet] = await Promise.all([
      $fetch('/api/vouchers/my', { params: { user_id: user.value.id } }),
      $fetch('/api/orders/my', { params: { user_id: user.value.id } }).catch(() => []),
      $fetch('/api/wishlist', { params: { user_id: user.value.id } }).catch(() => []),
      $fetch('/api/users/wallet', { params: { user_id: user.value.id } }).catch(() => null)
    ])
    voucherCount.value = Array.isArray(vouchers) ? vouchers.length : 0
    orderCount.value = Array.isArray(orders) ? orders.length : 0
    wishlistCount.value = Array.isArray(wishlist) ? wishlist.length : 0
    walletBalance.value = wallet ? wallet.balance : 0
  } catch (e) {
    console.error('Failed to fetch stats', e)
  }
}

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('user_info')
    if (saved) {
      user.value = JSON.parse(saved)
      fetchStats()
    } else {
      navigateTo('/auth/login')
    }
    loading.value = false
  }
})

const menuItems = [
  { name: 'Keranjang Saya', path: '/user/my/cart', icon: ShoppingBag, desc: 'Lihat barang yang ingin Anda beli' },
  { name: 'Wishlist Saya', path: '/user/my/whishlist', icon: Heart, desc: 'Produk favorit yang Anda simpan' },
  { name: 'Voucher Saya', path: '/user/my/allvouchers', icon: Ticket, desc: 'Klaim dan gunakan kupon diskon Anda' },
  { name: 'Pesanan Saya', path: '/user/my/orders', icon: Package, desc: 'Lacak status pengiriman pesanan' }
]

const orderStatuses = [
  { name: 'Dikemas', icon: Box, path: '/user/my/orders?status=dikemas' },
  { name: 'Dikirim', icon: Truck, path: '/user/my/orders?status=dikirim' },
  { name: 'Selesai', icon: CheckCircle2, path: '/user/my/orders?status=selesai' },
  { name: 'Batal', icon: RefreshCcw, path: '/user/my/orders?status=batal' }
]

const accountItems = [
  { name: 'Informasi Pribadi', icon: User, desc: 'Kelola data diri dan profil Anda' },
  { name: 'Alamat Saya', path: '/user/my/address', icon: MapPin, desc: 'Atur alamat pengiriman pesanan Anda' },
  { name: 'Keamanan', icon: Shield, desc: 'Ganti kata sandi dan amankan akun' },
  { name: 'Metode Pembayaran', path: '/user/my/wallets', icon: CreditCard, desc: 'Kelola kartu dan WardanaPay Anda' },
  { name: 'Notifikasi', icon: Bell, desc: 'Atur pemberitahuan promosi dan pesanan' }
]

function handleLogout() {
  if (import.meta.client) {
    localStorage.removeItem('user_info')
    navigateTo('/auth/login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 pt-32 pb-20">
    <div class="max-w-5xl mx-auto px-6">
      <div v-if="loading" class="flex justify-center py-20">
        <div class="w-10 h-10 border-4 border-neutral-200 border-t-soft-black rounded-full animate-spin"></div>
      </div>

      <div v-else-if="user" class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <!-- Sidebar: Profile Info -->
        <div class="lg:col-span-4 space-y-6">
          <div class="bg-white p-8 border border-border text-center space-y-4">
            <div class="relative w-32 h-32 mx-auto group">
              <img 
                :src="user.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'" 
                class="w-full h-full rounded-full object-cover border-4 border-neutral-50" 
              />
              <button class="absolute bottom-0 right-0 p-2 bg-soft-black text-white rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg">
                <Camera :size="14" />
              </button>
            </div>
            
            <div>
              <h2 class="text-xl font-serif text-soft-black">{{ user.username }}</h2>
              <p class="text-[10px] uppercase tracking-widest text-muted mt-1">{{ user.email }}</p>
            </div>

            <div class="pt-4 border-t border-border mt-6">
              <span class="px-3 py-1 bg-neutral-100 text-[9px] uppercase font-bold rounded-full tracking-widest text-muted">
                {{ user.level === 'admin' ? 'Administrator' : 'Premium Member' }}
              </span>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white p-4 border border-border text-center">
              <p class="text-[9px] uppercase tracking-widest text-muted mb-1">WardanaPay</p>
              <p class="text-sm font-bold">Rp{{ walletBalance.toLocaleString('id-ID') }}</p>
            </div>
            <div class="bg-white p-4 border border-border text-center">
              <p class="text-[9px] uppercase tracking-widest text-muted mb-1">Vouchers</p>
              <p class="text-lg font-bold">{{ voucherCount }}</p>
            </div>
          </div>

          <button @click="handleLogout" class="w-full py-4 border border-red-100 text-red-500 text-[10px] uppercase tracking-widest font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-3">
            <LogOut :size="14" />
            Sign Out
          </button>
        </div>

        <!-- Main Content: Menus -->
        <div class="lg:col-span-8 space-y-10">
          <!-- Shopping Menu -->
          <section class="space-y-4">
            <h3 class="text-xs uppercase tracking-[0.2em] font-bold text-soft-black ml-1">Belanja Saya</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NuxtLink v-for="item in menuItems" :key="item.path" :to="item.path" class="bg-white p-6 border border-border hover:border-soft-black transition-all group flex items-start gap-4">
                <div class="p-3 bg-neutral-50 rounded group-hover:bg-soft-black group-hover:text-white transition-colors">
                  <component :is="item.icon" :size="18" />
                </div>
                <div class="flex-1">
                  <div class="flex justify-between items-center mb-1">
                    <p class="text-xs font-bold uppercase tracking-widest">{{ item.name }}</p>
                    <ChevronRight :size="12" class="text-neutral-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p class="text-[10px] text-muted leading-relaxed">{{ item.desc }}</p>
                </div>
              </NuxtLink>
            </div>
          </section>

          <!-- My Orders Status -->
          <section class="space-y-4">
            <h3 class="text-xs uppercase tracking-[0.2em] font-bold text-soft-black ml-1">Pesanan saya</h3>
            <div class="bg-white border border-border grid grid-cols-4 divide-x divide-border">
              <NuxtLink v-for="status in orderStatuses" :key="status.name" :to="status.path" class="p-8 flex flex-col items-center gap-3 hover:bg-neutral-50 transition-all group">
                <div class="text-neutral-400 group-hover:text-soft-black transition-colors">
                  <component :is="status.icon" :size="24" stroke-width="1.5" />
                </div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-muted group-hover:text-soft-black transition-colors">{{ status.name }}</p>
              </NuxtLink>
            </div>
          </section>
 
          <!-- Account Settings -->
          <section class="space-y-4">
            <h3 class="text-xs uppercase tracking-[0.2em] font-bold text-soft-black ml-1">Pengaturan Akun</h3>
            <div class="bg-white border border-border divide-y divide-border">
              <template v-for="item in accountItems" :key="item.name">
                <NuxtLink 
                  v-if="item.path"
                  :to="item.path"
                  class="w-full p-6 hover:bg-neutral-50 transition-all text-left flex items-start gap-5 group no-underline"
                >
                  <div class="pt-1 text-neutral-400 group-hover:text-soft-black transition-colors">
                    <component :is="item.icon" :size="20" />
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between items-center mb-1">
                      <p class="text-sm font-bold text-soft-black">{{ item.name }}</p>
                      <ChevronRight :size="14" class="text-neutral-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p class="text-[10px] text-muted">{{ item.desc }}</p>
                  </div>
                </NuxtLink>
                <div 
                  v-else
                  class="w-full p-6 hover:bg-neutral-50 transition-all text-left flex items-start gap-5 group cursor-not-allowed opacity-60"
                >
                  <div class="pt-1 text-neutral-400">
                    <component :is="item.icon" :size="20" />
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between items-center mb-1">
                      <p class="text-sm font-bold text-soft-black">{{ item.name }}</p>
                      <ChevronRight :size="14" class="text-neutral-300" />
                    </div>
                    <p class="text-[10px] text-muted">{{ item.desc }}</p>
                  </div>
                </div>
              </template>
            </div>
          </section>

          <!-- Support -->
          <section class="bg-soft-black p-8 text-white flex justify-between items-center">
            <div class="space-y-2">
              <h4 class="text-lg font-serif">Butuh Bantuan?</h4>
              <p class="text-xs text-neutral-400">Tim dukungan kami siap membantu Anda 24/7.</p>
            </div>
            <button class="px-6 py-3 border border-white/20 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-soft-black transition-all">
              Hubungi Kami
            </button>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-soft-black { color: #1a1a1a; }
.bg-soft-black { background-color: #1a1a1a; }
</style>
