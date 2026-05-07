<script setup>
import { ShoppingBag, ArrowRight, Trash2, Minus, Plus, Check } from 'lucide-vue-next'

const user = ref(null)
const cartItems = ref([])
const loading = ref(true)
const { showAlert } = useAlert()
const selectedItems = ref([])

async function fetchCart() {
  if (!user.value) return
  loading.value = true
  try {
    const data = await $fetch('/api/cart/list', { params: { user_id: user.value.id } })
    cartItems.value = data?.cart || []
    // Reset selected items or match with existing
    selectedItems.value = []
  } catch (e) {
    showAlert('Gagal memuat keranjang', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('user_info')
    if (saved) {
      user.value = JSON.parse(saved)
      fetchCart()
    } else {
      navigateTo('/auth/login')
    }
  }
})

const subtotal = computed(() => {
  return selectedItems.value.reduce((acc, item) => acc + (item.price * item.quantity), 0)
})

const isAllSelected = computed(() => {
  return cartItems.value.length > 0 && selectedItems.value.length === cartItems.value.length
})

function toggleAll() {
  if (isAllSelected.value) selectedItems.value = []
  else selectedItems.value = [...cartItems.value]
}

function toggleSelect(item) {
  const index = selectedItems.value.findIndex(i => i.id === item.id)
  if (index > -1) selectedItems.value.splice(index, 1)
  else selectedItems.value.push(item)
}

function isSelected(item) {
  return selectedItems.value.some(i => i.id === item.id)
}

async function updateQuantity(item, delta) {
  const newQty = item.quantity + delta
  if (newQty < 1) return
  
  try {
    await $fetch('/api/cart', {
      method: 'POST',
      body: {
        user_id: user.value.id,
        product_id: item.product_id,
        type: 'cart',
        quantity: delta,
        variant_name: item.variant,
        size: item.size
      }
    })
    await fetchCart()
  } catch (e) {}
}

async function remove(item) {
  try {
    await $fetch('/api/cart', {
      method: 'DELETE',
      body: {
        user_id: user.value.id,
        product_id: item.product_id,
        type: 'cart',
        variant_name: item.variant,
        size: item.size
      }
    })
    await fetchCart()
    showAlert('Item dihapus', 'success')
  } catch (e) {}
}

function proceedToCheckout() {
  if (selectedItems.value.length === 0) {
    showAlert('Pilih minimal satu produk untuk melanjutkan', 'error')
    return
  }
  localStorage.setItem('checkout_items', JSON.stringify(selectedItems.value))
  navigateTo('/user/checkout')
}
</script>

<template>
  <div class="min-h-screen bg-white pt-32 pb-20">
    <div class="max-w-7xl mx-auto px-6">
      <div class="mb-12">
        <ButtonBackButton label="Kembali" />
      </div>

      <div v-if="loading" class="flex flex-col items-center justify-center py-20">
        <div class="w-10 h-10 border-4 border-neutral-100 border-t-soft-black rounded-full animate-spin"></div>
      </div>

      <div v-else-if="cartItems.length === 0" class="flex flex-col items-center justify-center py-20 space-y-6">
        <div class="w-20 h-20 bg-neutral-50 flex items-center justify-center rounded-full">
          <ShoppingBag :size="32" class="text-neutral-300" />
        </div>
        <div class="text-center">
          <h2 class="text-xl font-serif mb-2">Tas Anda kosong</h2>
          <p class="text-sm text-muted">Sepertinya Anda belum menambahkan apa pun ke tas belanja Anda.</p>
        </div>
        <NuxtLink to="/product/all" class="bg-soft-black text-white px-10 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-neutral-800 transition-colors">
          Mulai Belanja
        </NuxtLink>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <!-- List Items -->
        <div class="lg:col-span-8 space-y-6">
          <!-- Select All -->
          <div class="flex items-center gap-4 pb-6 border-b border-border">
            <button @click="toggleAll" 
              class="w-5 h-5 border flex items-center justify-center transition-colors"
              :class="isAllSelected ? 'bg-soft-black border-soft-black text-white' : 'border-neutral-300 bg-white'"
            >
              <Check v-if="isAllSelected" :size="14" />
            </button>
            <span class="text-xs font-bold uppercase tracking-widest">Pilih Semua ({{ cartItems.length }})</span>
          </div>

          <div v-for="item in cartItems" :key="item.id" class="flex flex-col sm:flex-row gap-4 sm:gap-6 pb-8 border-b border-border group relative">
            <div class="flex gap-4 sm:gap-6">
              <!-- Checkbox -->
              <div class="pt-8 sm:pt-16">
                <button @click="toggleSelect(item)" 
                  class="w-5 h-5 border flex items-center justify-center transition-colors"
                  :class="isSelected(item) ? 'bg-soft-black border-soft-black text-white' : 'border-neutral-300 bg-white'"
                >
                  <Check v-if="isSelected(item)" :size="14" />
                </button>
              </div>

              <!-- Image -->
              <div class="w-24 h-32 sm:w-32 sm:h-44 bg-neutral-100 border border-border overflow-hidden flex-shrink-0 relative">
                <img :src="item.image" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              
              <div class="flex-1 flex flex-col justify-between py-1 sm:py-2">
                <div>
                  <div class="flex justify-between items-start">
                    <h3 class="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold text-soft-black truncate max-w-[150px] sm:max-w-none">{{ item.name }}</h3>
                    <button @click="remove(item)" class="text-neutral-400 hover:text-red-500 transition-colors sm:static absolute top-0 right-0">
                      <Trash2 :size="16" />
                    </button>
                  </div>
                  <p class="text-[8px] sm:text-[10px] text-muted uppercase tracking-widest mt-1">{{ item.variant }} / {{ item.size }}</p>
                  <p class="text-xs sm:text-sm font-medium mt-2 sm:mt-4">Rp{{ item.price.toLocaleString('id-ID') }}</p>
                </div>

                <div class="flex justify-between items-end mt-4 sm:mt-0">
                  <div class="flex items-center border border-border scale-90 sm:scale-100 origin-left">
                    <button @click="updateQuantity(item, -1)" class="px-2 sm:px-3 py-1 sm:py-2 hover:bg-neutral-50 transition-colors">
                      <Minus :size="12" />
                    </button>
                    <span class="px-3 sm:px-4 text-[10px] sm:text-xs font-bold">{{ item.quantity }}</span>
                    <button @click="updateQuantity(item, 1)" class="px-2 sm:px-3 py-1 sm:py-2 hover:bg-neutral-50 transition-colors">
                      <Plus :size="12" />
                    </button>
                  </div>
                  <p class="text-xs sm:text-sm font-bold">Rp{{ (item.price * item.quantity).toLocaleString('id-ID') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-4">
          <div class="bg-neutral-50 p-8 sticky top-32 border border-border">
            <h2 class="text-xs uppercase tracking-[0.2em] font-bold mb-8 pb-4 border-b border-border">Ringkasan Belanja</h2>
            
            <div class="space-y-4 mb-8">
              <div class="flex justify-between text-xs uppercase tracking-widest">
                <span class="text-muted">Total Harga ({{ selectedItems.length }} barang)</span>
                <span class="font-bold text-soft-black">Rp{{ subtotal.toLocaleString('id-ID') }}</span>
              </div>
            </div>

            <div class="pt-6 border-t border-border mb-8">
              <div class="flex justify-between items-end">
                <span class="text-xs uppercase tracking-[0.2em] font-bold">Subtotal</span>
                <span class="text-2xl font-serif text-soft-black">Rp{{ subtotal.toLocaleString('id-ID') }}</span>
              </div>
            </div>

            <button @click="proceedToCheckout" class="w-full bg-soft-black text-white py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-3 shadow-xl shadow-soft-black/10">
              Beli ({{ selectedItems.length }})
              <ArrowRight :size="16" />
            </button>

            <p class="mt-6 text-[9px] text-muted text-center uppercase tracking-widest leading-loose">
              Voucher dan alamat pengiriman dapat dipilih di halaman berikutnya.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-soft-black { color: #1a1a1a; }
.bg-soft-black { background-color: #1a1a1a; }
</style>
