<script setup>
import { Heart, ShoppingBag, Trash2 } from 'lucide-vue-next'

const user = ref(null)
const wishlistItems = ref([])
const loading = ref(true)
const { showAlert } = useAlert()

async function fetchWishlist() {
  if (!user.value) return
  loading.value = true
  try {
    const data = await $fetch('/api/cart/list', { params: { user_id: user.value.id } })
    wishlistItems.value = data.wishlist
  } catch (e) {
    showAlert('Gagal memuat wishlist', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('user_info')
    if (saved) {
      user.value = JSON.parse(saved)
      fetchWishlist()
    } else {
      navigateTo('/auth/login')
    }
  }
})

async function remove(item) {
  try {
    await $fetch('/api/cart', {
      method: 'DELETE',
      body: {
        user_id: user.value.id,
        product_id: item.product_id,
        type: 'wishlist'
      }
    })
    await fetchWishlist()
    showAlert('Dihapus dari wishlist', 'success')
  } catch (e) {}
}
</script>

<template>
  <div class="min-h-screen bg-white pt-32 pb-20">
    <div class="max-w-7xl mx-auto px-6">
      <div class="mb-12">
        <ButtonBackButton label="Kembali" to="/product/all" />
      </div>

      <div v-if="loading" class="flex flex-col items-center justify-center py-20">
        <div class="w-10 h-10 border-4 border-neutral-100 border-t-soft-black rounded-full animate-spin"></div>
      </div>

      <div v-else-if="wishlistItems.length === 0" class="flex flex-col items-center justify-center py-20 space-y-6">
        <div class="w-20 h-20 bg-neutral-50 flex items-center justify-center rounded-full">
          <Heart :size="32" class="text-neutral-300" />
        </div>
        <div class="text-center">
          <h2 class="text-xl font-serif mb-2">Wishlist kosong</h2>
          <p class="text-sm text-muted">Simpan barang yang Anda sukai untuk menemukannya dengan mudah nanti.</p>
        </div>
        <NuxtLink to="/product/all" class="bg-soft-black text-white px-10 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-neutral-800 transition-colors">
          Jelajahi Produk
        </NuxtLink>
      </div>

      <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        <div v-for="item in wishlistItems" :key="item.id" class="group">
          <div class="aspect-[3/4] bg-neutral-100 border border-border overflow-hidden relative mb-4">
            <img :src="item.image" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            
            <!-- Quick Actions -->
            <div class="absolute top-4 right-4 space-y-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
              <button @click="remove(item)" class="w-10 h-10 bg-white border border-border flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm">
                <Trash2 :size="16" />
              </button>
            </div>
            
            <NuxtLink :to="`/product/view/${item.product_id}`" class="absolute inset-0 z-0"></NuxtLink>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between items-start">
              <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold text-soft-black truncate flex-1">{{ item.name }}</h3>
              <p class="text-[10px] font-bold">Rp{{ item.price.toLocaleString('id-ID') }}</p>
            </div>
            <p v-if="item.variant" class="text-[9px] text-muted uppercase tracking-widest">{{ item.variant }} / {{ item.size }}</p>
            <NuxtLink :to="`/product/view/${item.product_id}`" class="block w-full py-3 border border-border text-[9px] uppercase tracking-[0.2em] font-bold text-center hover:bg-soft-black hover:text-white transition-all mt-2">
              Lihat Detail
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
