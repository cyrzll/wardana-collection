<script setup>
import { 
  ShoppingBag, 
  Search, 
  Menu, 
  User, 
  LogOut, 
  LayoutDashboard,
  Heart,
  ChevronRight,
  Trash2,
  Settings,
  MapPin,
  Wallet
} from 'lucide-vue-next'

const user = ref(null)
const showMenu = ref(false)
const showCartPreview = ref(false)
const showWishlistPreview = ref(false)
const walletBalance = ref(0)

// Use global cart state
const { cartItems, wishlistItems, cartCount, wishlistCount, fetchCartData } = useCart()

const showCategories = ref(false)
const categories = ref([])
const genders = ref([])

onMounted(async () => {
  if (import.meta.client) {
    const saved = localStorage.getItem('user_info')
    if (saved) {
      user.value = JSON.parse(saved)
      fetchCartData() // Initial fetch
      
      // Fetch wallet balance
      try {
        const wallet = await $fetch('/api/users/wallet', { params: { user_id: user.value.id } }).catch(() => null)
        walletBalance.value = wallet ? wallet.balance : 0
      } catch (e) {}
    }

    try {
      const [cats, gens] = await Promise.all([
        $fetch('/api/categories'),
        $fetch('/api/genders')
      ])
      categories.value = cats
      genders.value = gens
    } catch (e) {
      console.error('Failed to fetch nav data', e)
    }
  }
})

function logout() {
  if (import.meta.client) {
    localStorage.removeItem('user_info')
    user.value = null
    showMenu.value = false
    cartItems.value = []
    wishlistItems.value = []
    navigateTo('/auth/login')
  }
}

function proceedToCheckoutNav() {
  if (cartItems.value.length === 0) return
  localStorage.setItem('checkout_items', JSON.stringify(cartItems.value))
  navigateTo('/user/checkout')
}
</script>

<template>
  <nav class="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border transition-all duration-300">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <!-- Left: Menu -->
      <nav class="hidden md:flex items-center gap-10">
        <NuxtLink to="/" class="text-[11px] uppercase tracking-[0.25em] font-medium hover:text-soft-black transition-colors">Beranda</NuxtLink>
        <NuxtLink to="/product/all" class="text-[11px] uppercase tracking-[0.25em] font-medium hover:text-soft-black transition-colors">Belanja</NuxtLink>
        
        <!-- Categories Trigger -->
        <div class="relative group h-20 flex items-center" 
             @mouseenter="showCategories = true" 
             @mouseleave="showCategories = false">
          <button class="text-[11px] uppercase tracking-[0.25em] font-medium hover:text-soft-black transition-colors flex items-center gap-2">
            Kategori
          </button>

          <!-- Mega Menu -->
          <Transition name="mega-menu">
            <div v-if="showCategories" class="absolute top-20 left-[-100px] w-[800px] bg-white border border-border shadow-2xl p-12 z-50">
              <div class="grid grid-cols-12 gap-12">
                <!-- Shop By Gender -->
                <div class="col-span-4 space-y-6">
                  <h3 class="text-[10px] uppercase tracking-[0.3em] font-bold text-muted border-b border-border pb-3">Gender</h3>
                  <div class="space-y-4">
                    <NuxtLink 
                      v-for="gender in genders" 
                      :key="gender.id"
                      :to="`/product/all?gender=${gender.id}`"
                      class="block text-xs uppercase tracking-widest font-medium hover:pl-2 transition-all hover:text-soft-black"
                    >
                      {{ gender.name }}
                    </NuxtLink>
                  </div>
                </div>

                <!-- Shop By Category -->
                <div class="col-span-8 space-y-6">
                  <h3 class="text-[10px] uppercase tracking-[0.3em] font-bold text-muted border-b border-border pb-3">Kategori</h3>
                  <div class="grid grid-cols-2 gap-x-12 gap-y-4">
                    <NuxtLink 
                      v-for="cat in categories" 
                      :key="cat.id"
                      :to="`/product/all?category=${cat.id}`"
                      class="block text-xs uppercase tracking-widest font-medium hover:pl-2 transition-all hover:text-soft-black"
                    >
                      {{ cat.name }}
                    </NuxtLink>
                  </div>
                </div>
              </div>

              <!-- Extra Content / Promo -->
              <div class="mt-12 pt-8 border-t border-border flex justify-between items-center">
                <p class="text-[10px] uppercase tracking-widest text-muted">Jelajahi koleksi esensial terbaru kami</p>
                <NuxtLink to="/product/all" class="text-[10px] uppercase tracking-[0.2em] font-bold hover:underline">Lihat Semua Koleksi</NuxtLink>
              </div>
            </div>
          </Transition>
        </div>

        <NuxtLink v-if="user?.level === 'admin'" to="/admin/dashboard" class="text-[11px] uppercase tracking-[0.25em] font-medium hover:text-soft-black transition-colors">Admin</NuxtLink>
      </nav>
      
      <!-- Mobile Menu Icon -->
      <button class="md:hidden">
        <Menu :size="20" />
      </button>

      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <NuxtLink to="/" class="text-2xl font-serif tracking-[0.2em] uppercase">WARDANA</NuxtLink>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center space-x-6">
        <button class="hover:opacity-50 transition-opacity">
          <Search :size="20" />
        </button>
        
        <div class="relative group h-20 flex items-center" 
             @mouseenter="showMenu = true" 
             @mouseleave="showMenu = false">
          <div v-if="user" class="h-20 flex items-center cursor-pointer">
            <img v-if="user.profile_image" :src="user.profile_image" class="w-8 h-8 rounded-full object-cover border border-border shadow-sm" />
            <User v-else :size="20" />
          </div>
          <NuxtLink 
            v-else 
            to="/auth/login" 
            class="h-20 flex items-center hover:opacity-50 transition-opacity"
          >
            <User :size="20" />
          </NuxtLink>
          <Transition name="mega-menu">
            <div v-if="showMenu && user" class="absolute top-20 right-0 w-[400px] bg-white border border-border shadow-2xl p-8 z-50">
              <!-- Profile Header -->
              <div class="flex items-center gap-4 mb-8 pb-8 border-b border-border">
                <div class="w-16 h-16 rounded-full border border-border overflow-hidden">
                  <img v-if="user.profile_image" :src="user.profile_image" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full bg-neutral-50 flex items-center justify-center">
                    <User :size="30" class="text-neutral-300" />
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] text-muted uppercase tracking-widest mb-1">Masuk sebagai</p>
                  <h4 class="text-lg font-serif truncate">{{ user.username }}</h4>
                  <p class="text-xs text-muted truncate">{{ user.email }}</p>
                  <div class="mt-2 flex items-center gap-2">
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-soft-black">Rp{{ walletBalance.toLocaleString('id-ID') }}</p>
                  </div>
                </div>
              </div>

              <!-- Navigation Grid -->
              <div class="grid grid-cols-2 gap-8 mb-8">
                <div class="space-y-4">
                  <h3 class="text-[9px] uppercase tracking-[0.3em] font-bold text-muted border-b border-border pb-2">Akun</h3>
                  <div class="space-y-3">
                    <NuxtLink to="/user/settings" class="block text-[10px] uppercase tracking-widest font-bold hover:text-soft-black transition-colors flex items-center gap-2">
                      <Settings :size="12" /> Pengaturan
                    </NuxtLink>
                    <NuxtLink to="/user/my/address" class="block text-[10px] uppercase tracking-widest font-bold hover:text-soft-black transition-colors flex items-center gap-2">
                      <MapPin :size="12" /> Alamat Saya
                    </NuxtLink>
                    <NuxtLink to="/user/my/wallets" class="block text-[10px] uppercase tracking-widest font-bold hover:text-soft-black transition-colors flex items-center gap-2">
                      <Wallet :size="12" /> WardanaPay
                    </NuxtLink>
                  </div>
                </div>
                <div class="space-y-4">
                  <h3 class="text-[9px] uppercase tracking-[0.3em] font-bold text-muted border-b border-border pb-2">Belanja</h3>
                  <div class="space-y-3">
                    <NuxtLink to="/user/my/orders" class="block text-[10px] uppercase tracking-widest font-bold hover:text-soft-black transition-colors flex items-center gap-2">
                      <ShoppingBag :size="12" /> Pesanan
                    </NuxtLink>
                    <NuxtLink to="/user/my/whishlist" class="block text-[10px] uppercase tracking-widest font-bold hover:text-soft-black transition-colors flex items-center gap-2">
                      <Heart :size="12" /> Wishlist
                    </NuxtLink>
                  </div>
                </div>
              </div>

              <!-- Footer Actions -->
              <div class="pt-6 border-t border-border flex justify-between items-center">
                <NuxtLink v-if="user.level === 'admin'" to="/admin/dashboard" class="text-[10px] uppercase tracking-[0.2em] font-bold text-soft-black hover:underline flex items-center gap-2">
                  <LayoutDashboard :size="14" /> Panel Admin
                </NuxtLink>
                <button @click="logout" class="text-[10px] uppercase tracking-[0.2em] font-bold text-red-600 hover:underline flex items-center gap-2 ml-auto">
                  <LogOut :size="14" /> Keluar
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Logged In Only Icons -->
        <template v-if="user">
          <!-- Wishlist -->
          <div class="relative" @mouseenter="showWishlistPreview = true" @mouseleave="showWishlistPreview = false">
            <NuxtLink to="/user/my/whishlist" class="hover:opacity-50 transition-opacity block py-2">
              <Heart :size="20" :class="wishlistCount > 0 ? 'text-red-500 fill-red-500' : ''" />
              <span v-if="wishlistCount > 0" class="absolute top-1 -right-1 bg-soft-black text-white text-[7px] w-3.5 h-3.5 flex items-center justify-center rounded-full">{{ wishlistCount }}</span>
            </NuxtLink>

            <!-- Wishlist Preview -->
            <Transition name="fade-slide">
              <div v-if="showWishlistPreview && wishlistItems.length" class="absolute right-0 mt-2 w-72 bg-white border border-border shadow-2xl p-4 z-50">
                <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold mb-4 border-b border-border pb-2">Wishlist Anda</h3>
                <div class="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  <div v-for="item in wishlistItems.slice(0, 3)" :key="item.id" class="flex gap-3 group">
                    <div class="w-12 h-16 bg-neutral-100 border border-border overflow-hidden flex-shrink-0">
                      <img :src="item.image" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[10px] font-bold truncate uppercase tracking-widest">{{ item.name }}</p>
                      <p class="text-[10px] text-muted">Rp{{ item.price.toLocaleString('id-ID') }}</p>
                    </div>
                  </div>
                </div>
                <NuxtLink to="/user/my/whishlist" class="mt-4 flex items-center justify-between w-full py-2 text-[9px] uppercase tracking-[0.2em] font-bold border-t border-border hover:text-soft-black transition-colors">
                  Lihat Semua Wishlist <ChevronRight :size="12" />
                </NuxtLink>
              </div>
            </Transition>
          </div>

          <!-- Cart -->
          <div class="relative" @mouseenter="showCartPreview = true" @mouseleave="showCartPreview = false">
            <NuxtLink to="/user/my/cart" class="relative hover:opacity-50 transition-opacity block py-2">
              <ShoppingBag :size="20" />
              <span v-if="cartCount > 0" class="absolute top-1 -right-1 bg-soft-black text-white text-[7px] w-3.5 h-3.5 flex items-center justify-center rounded-full">{{ cartCount }}</span>
            </NuxtLink>

            <!-- Cart Preview -->
            <Transition name="fade-slide">
              <div v-if="showCartPreview && cartItems.length" class="absolute right-0 mt-2 w-80 bg-white border border-border shadow-2xl p-5 z-50">
                <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold mb-4 border-b border-border pb-3">Tas Belanja ({{ cartCount }})</h3>
                <div class="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  <div v-for="item in cartItems.slice(0, 3)" :key="item.id" class="flex gap-4">
                    <div class="w-16 h-20 bg-neutral-100 border border-border overflow-hidden flex-shrink-0">
                      <img :src="item.image" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1 min-w-0 space-y-1">
                      <p class="text-[10px] font-bold truncate uppercase tracking-widest">{{ item.name }}</p>
                      <p class="text-[9px] text-muted uppercase tracking-widest">{{ item.variant }} / {{ item.size }}</p>
                      <div class="flex justify-between items-center">
                        <p class="text-[10px] font-medium">Qty: {{ item.quantity }}</p>
                        <p class="text-[10px] font-bold">Rp{{ (item.price * item.quantity).toLocaleString('id-ID') }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="cartCount > 3" class="py-2 text-center">
                  <p class="text-[9px] text-muted italic">+ {{ cartCount - 3 }} item lainnya</p>
                </div>
                <div class="mt-4 pt-4 border-t border-border space-y-3">
                  <div class="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>Rp{{ cartItems.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString('id-ID') }}</span>
                  </div>
                  <button @click="proceedToCheckoutNav" class="block w-full bg-soft-black text-white text-center py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-neutral-800 transition-colors">
                    Checkout Sekarang
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </template>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.mega-menu-enter-active, .mega-menu-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.mega-menu-enter-from {
  opacity: 0;
  transform: translateY(15px);
}
.mega-menu-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 2px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e5e5;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #1a1a1a;
}
</style>
