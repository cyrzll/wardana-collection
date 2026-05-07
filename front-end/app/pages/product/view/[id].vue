<script setup>
import { ShoppingBag, Heart, Share2, ShieldCheck, Truck, RefreshCw, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const id = route.params.id
const { showAlert } = useAlert()
const { fetchCartData } = useCart()

const { data: product, error } = await useFetch(`/api/products/${id}`)

const activeImage = ref(0)
const selectedFit = ref('')
const selectedSize = ref('')
const user = ref(null)
const loadingCart = ref(false)
const loadingWishlist = ref(false)

// Status checks
const inWishlist = ref(false)
const inCart = ref(false)

async function checkStatus() {
  if (!user.value || !product.value) return
  
  try {
    const data = await $fetch('/api/cart/list', { params: { user_id: user.value.id } })
    inWishlist.value = data.wishlist.some(i => i.product_id === product.value.id)
    inCart.value = data.cart.some(i => 
      i.product_id === product.value.id && 
      i.variant === selectedFit.value && 
      i.size === selectedSize.value
    )
  } catch (e) {}
}

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('user_info')
    if (saved) {
      user.value = JSON.parse(saved)
      checkStatus()
    }
  }
})

// Advanced Variant Logic
const currentVariant = computed(() => {
  if (!product.value?.variants?.length) return null
  return product.value.variants.find(v => v.name === selectedFit.value) || product.value.variants[0]
})

const displayedImages = computed(() => {
  if (currentVariant.value?.images?.length) return currentVariant.value.images
  return product.value?.images || []
})

const displayedPrice = computed(() => {
  if (currentVariant.value) {
    const disc = currentVariant.value.discount !== undefined ? currentVariant.value.discount : (product.value.discount || 0)
    return Math.round(currentVariant.value.price * (1 - (disc / 100)))
  }
  return product.value?.price || 0
})

const displayedOriginalPrice = computed(() => {
  return currentVariant.value?.price || product.value?.selling_price || 0
})

const currentDiscount = computed(() => {
  if (currentVariant.value) {
    return currentVariant.value.discount !== undefined ? currentVariant.value.discount : (product.value.discount || 0)
  }
  return product.value?.discount || 0
})

const availableSizes = computed(() => {
  return currentVariant.value?.sizes || []
})

const currentSizeStock = computed(() => {
  if (!currentVariant.value || !selectedSize.value) return 0
  const sizeObj = currentVariant.value.sizes?.find(s => s.name === selectedSize.value)
  return sizeObj ? parseInt(sizeObj.stock || 0) : 0
})

// Reset state when variant changes
watch([selectedFit, selectedSize], () => {
  activeImage.value = 0
  checkStatus()
})

watch(product, (newVal) => {
  if (newVal) {
    if (newVal.options?.length) selectedFit.value = newVal.options[0]
    if (availableSizes.value.length) selectedSize.value = availableSizes.value[0].name
  }
}, { immediate: true })

async function handlePrimaryAction() {
  if (!user.value) {
    showAlert('Please login to continue', 'error')
    return navigateTo('/auth/login')
  }
  
  // Always add to cart if not already there, then go to checkout
  if (!inCart.value) {
    loadingCart.value = true
    try {
      await $fetch('/api/cart', {
        method: 'POST',
        body: {
          user_id: user.value.id,
          product_id: product.value.id,
          type: 'cart',
          quantity: 1,
          variant_name: selectedFit.value,
          size: selectedSize.value
        }
      })
      await fetchCartData()
    } catch (e) {
      showAlert('Gagal memproses checkout', 'error')
      loadingCart.value = false
      return
    }
  }
  
  // Directly navigate to checkout
  const checkoutItem = {
    product_id: product.value.id,
    name: product.value.name,
    price: displayedPrice.value,
    quantity: 1,
    variant: selectedFit.value,
    size: selectedSize.value,
    image: displayedImages.value[0]
  }
  localStorage.setItem('checkout_items', JSON.stringify([checkoutItem]))
  return navigateTo('/user/checkout')
}

async function toggleCart() {
  if (!user.value) {
    showAlert('Please login to continue', 'error')
    return navigateTo('/auth/login')
  }

  loadingCart.value = true
  try {
    if (inCart.value) {
      // Remove
      await $fetch('/api/cart', {
        method: 'DELETE',
        body: {
          user_id: user.value.id,
          product_id: product.value.id,
          type: 'cart',
          variant_name: selectedFit.value,
          size: selectedSize.value
        }
      })
      showAlert('Removed from bag', 'success')
    } else {
      // Add
      await $fetch('/api/cart', {
        method: 'POST',
        body: {
          user_id: user.value.id,
          product_id: product.value.id,
          type: 'cart',
          quantity: 1,
          variant_name: selectedFit.value,
          size: selectedSize.value
        }
      })
      showAlert('Added to bag', 'success')
    }
    await checkStatus()
    await fetchCartData() // Sync navbar
  } catch (e) {
    showAlert('Operation failed', 'error')
  } finally {
    loadingCart.value = false
  }
}

async function toggleWishlist() {
  if (!user.value) {
    showAlert('Please login to continue', 'error')
    return navigateTo('/auth/login')
  }

  loadingWishlist.value = true
  try {
    if (inWishlist.value) {
      await $fetch('/api/cart', {
        method: 'DELETE',
        body: {
          user_id: user.value.id,
          product_id: product.value.id,
          type: 'wishlist'
        }
      })
      showAlert('Removed from wishlist', 'success')
    } else {
      await $fetch('/api/cart', {
        method: 'POST',
        body: {
          user_id: user.value.id,
          product_id: product.value.id,
          type: 'wishlist',
          variant_name: selectedFit.value,
          size: selectedSize.value
        }
      })
      showAlert('Saved to wishlist', 'success')
    }
    await checkStatus()
    await fetchCartData() // Sync navbar
  } catch (e) {
    showAlert('Operation failed', 'error')
  } finally {
    loadingWishlist.value = false
  }
}

const { resolveImage } = useImage()

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan' })
}
</script>

<template>
  <div class="min-h-screen bg-white pt-24 pb-20">
    <div class="max-w-7xl mx-auto px-6">
      <!-- Back Button & Breadcrumb -->
      <div class="mb-6 md:mb-10 flex items-center gap-4 md:gap-6">
        <ButtonBackButton />
        <nav class="flex items-center gap-2 text-[8px] md:text-[10px] uppercase tracking-widest text-muted">
          <span>/</span>
          <span class="text-soft-black font-bold truncate max-w-[100px] md:max-w-none">{{ product.name }}</span>
        </nav>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <!-- Left: Image Gallery (7 cols) -->
        <div class="lg:col-span-7 space-y-4">
          <div class="aspect-[4/5] bg-neutral-100 border border-border overflow-hidden relative group">
            <Transition name="fade" mode="out-in">
              <img 
                :key="`${selectedFit}-${activeImage}`"
                :src="resolveImage(displayedImages[activeImage])" 
                class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
            </Transition>
            
            <!-- Discount Badge -->
            <div v-if="currentDiscount > 0" class="absolute top-6 left-6 bg-soft-black text-white text-[11px] font-bold px-3 py-1.5 uppercase tracking-[0.2em] z-10">
              PROMO {{ currentDiscount }}% OFF
            </div>
          </div>
          
          <!-- Thumbnails -->
          <div v-if="displayedImages.length > 1" class="grid grid-cols-5 gap-4">
            <button 
              v-for="(img, idx) in displayedImages" 
              :key="idx"
              @click="activeImage = idx"
              class="aspect-square border transition-all duration-300 overflow-hidden"
              :class="activeImage === idx ? 'border-soft-black opacity-100' : 'border-border opacity-50 hover:opacity-80'"
            >
              <img :src="resolveImage(img)" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        <!-- Right: Product Details (5 cols) -->
        <div class="lg:col-span-5 space-y-10">
          <div class="space-y-3 md:space-y-4">
            <p class="text-[10px] md:text-xs uppercase tracking-[0.3em] text-muted">{{ product.category_name || 'Essentials' }}</p>
            <h1 class="text-3xl md:text-5xl font-serif text-soft-black leading-tight">{{ product.name }}</h1>
            
            <div class="flex items-end gap-4 pt-2">
              <p class="text-2xl font-sans font-medium text-soft-black">Rp{{ displayedPrice.toLocaleString('id-ID') }}</p>
              <p v-if="currentDiscount > 0" class="text-sm text-neutral-400 line-through mb-1">
                Rp{{ displayedOriginalPrice.toLocaleString('id-ID') }}
              </p>
            </div>
          </div>

          <!-- Selectors -->
          <div class="space-y-8 pt-6 border-t border-border">
            <!-- Fit Selector (Variants) -->
            <div v-if="product.options?.length">
              <div class="flex justify-between items-center mb-4">
                <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Pilih Varian</label>
                <span class="text-[10px] text-muted uppercase tracking-widest">{{ selectedFit }}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button 
                  v-for="fit in product.options" 
                  :key="fit"
                  @click="selectedFit = fit"
                  class="px-6 py-3 text-[10px] uppercase tracking-widest border transition-all duration-300"
                  :class="selectedFit === fit ? 'bg-soft-black text-white border-soft-black font-bold' : 'border-border text-muted hover:border-soft-black hover:text-soft-black'"
                >
                  {{ fit }}
                </button>
              </div>
            </div>

            <!-- Size Selector -->
            <div v-if="availableSizes.length">
              <div class="flex justify-between items-center mb-4">
                <label class="text-[10px] uppercase tracking-widest font-bold">Pilih Ukuran</label>
                <button class="text-[10px] text-muted uppercase tracking-widest underline underline-offset-4 hover:text-soft-black">Panduan Ukuran</button>
              </div>
              <div class="grid grid-cols-4 gap-2">
                <button 
                  v-for="size in availableSizes" 
                  :key="size.name"
                  @click="selectedSize = size.name"
                  :disabled="parseInt(size.stock || 0) <= 0"
                  class="py-3 text-[10px] uppercase tracking-widest border transition-all duration-300 relative overflow-hidden"
                  :class="[
                    selectedSize === size.name ? 'bg-soft-black text-white border-soft-black font-bold' : 'border-border text-muted hover:border-soft-black hover:text-soft-black',
                    parseInt(size.stock || 0) <= 0 ? 'opacity-30 cursor-not-allowed bg-neutral-50' : ''
                  ]"
                >
                  {{ size.name }}
                  <div v-if="parseInt(size.stock || 0) <= 0" class="absolute inset-0 flex items-center justify-center rotate-12">
                    <div class="w-full h-[1px] bg-neutral-400"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Inventory Status -->
          <p v-if="selectedSize" class="text-[10px] uppercase tracking-widest" :class="currentSizeStock <= 0 ? 'text-red-500' : 'text-green-600'">
            {{ currentSizeStock <= 0 ? 'Ukuran ini Habis' : `Stok Ukuran ${selectedSize}: ${currentSizeStock} tersedia` }}
          </p>

          <!-- Action Buttons -->
          <div class="pt-6 space-y-4">
            <!-- Primary: Checkout -->
            <button @click="handlePrimaryAction" :disabled="currentSizeStock <= 0 || loadingCart" class="w-full bg-soft-black text-white py-5 text-[11px] uppercase tracking-[0.3em] font-bold hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:bg-neutral-300 disabled:cursor-not-allowed shadow-lg shadow-soft-black/10 flex items-center justify-center gap-3">
              <Loader2 v-if="loadingCart" :size="16" class="animate-spin" />
              {{ currentSizeStock <= 0 ? 'Habis Terjual' : 'Checkout Sekarang' }}
            </button>
            
            <!-- Secondary Grid -->
            <div class="grid grid-cols-6 gap-3">
              <!-- Add to Bag (4 cols) -->
              <button @click="toggleCart" :disabled="currentSizeStock <= 0 || loadingCart" class="col-span-4 flex items-center justify-center gap-3 py-4 border text-[10px] uppercase tracking-widest font-bold transition-all duration-300 disabled:opacity-50"
                :class="inCart ? 'bg-soft-black text-white border-soft-black shadow-inner' : 'border-border hover:bg-neutral-50'">
                <Loader2 v-if="loadingCart" :size="14" class="animate-spin" />
                <template v-else>
                  <ShoppingBag :size="14" />
                  {{ inCart ? 'Dalam Tas' : 'Masukkan ke Tas' }}
                </template>
              </button>
              <!-- Wishlist (1 col) -->
              <button @click="toggleWishlist" :disabled="loadingWishlist" class="col-span-1 flex items-center justify-center py-4 border transition-all duration-300 group disabled:opacity-50"
                :class="inWishlist ? 'bg-neutral-100 border-soft-black shadow-inner' : 'border-border hover:bg-neutral-50'">
                <Loader2 v-if="loadingWishlist" :size="14" class="animate-spin" />
                <Heart v-else :size="16" :class="inWishlist ? 'text-red-500 fill-red-500' : 'text-neutral-400 group-hover:text-red-500'" />
              </button>
              <!-- Share (1 col) -->
              <button class="col-span-1 flex items-center justify-center py-4 border border-border hover:bg-neutral-50 transition-colors text-neutral-400 hover:text-soft-black">
                <Share2 :size="16" />
              </button>
            </div>
          </div>

          <!-- Description -->
          <div class="pt-10 border-t border-border">
            <h3 class="text-[10px] uppercase tracking-widest font-bold mb-4">Deskripsi</h3>
            <p class="text-sm text-neutral-600 leading-relaxed font-serif italic">
              {{ product.description || 'Karya abadi yang dibuat dengan teliti menggunakan bahan-bahan terbaik, mewujudkan esensi kemewahan modern dan desain minimalis.' }}
            </p>
          </div>

          <!-- Shipping/Returns Info -->
          <div class="grid grid-cols-3 gap-4 pt-10 border-t border-border">
            <div class="text-center space-y-2">
              <Truck :size="18" class="mx-auto text-neutral-400" />
              <p class="text-[8px] uppercase tracking-widest font-bold">Pengiriman Cepat</p>
            </div>
            <div class="text-center space-y-2">
              <ShieldCheck :size="18" class="mx-auto text-neutral-400" />
              <p class="text-[8px] uppercase tracking-widest font-bold">Kualitas Mewah</p>
            </div>
            <div class="text-center space-y-2">
              <RefreshCw :size="18" class="mx-auto text-neutral-400" />
              <p class="text-[8px] uppercase tracking-widest font-bold">Mudah Retur</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.text-soft-black { color: #1a1a1a; }
.bg-soft-black { background-color: #1a1a1a; }
</style>
