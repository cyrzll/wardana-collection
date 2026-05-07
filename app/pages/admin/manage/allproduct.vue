<script setup>
import { Plus, Pencil, Trash2, ExternalLink, ShoppingBag, Search, AlertTriangle, Loader2 } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin'
})

const { showAlert } = useAlert()
const { data: products, refresh } = await useFetch('/api/products')
const { data: categories } = await useFetch('/api/categories')
const { data: genders } = await useFetch('/api/genders')

const loading = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedGender = ref('')

// Delete confirmation states
const showDeleteConfirm = ref(false)
const productToDelete = ref(null)

const filteredProducts = computed(() => {
  if (!products.value) return []
  return products.value.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = !selectedCategory.value || p.category_id === parseInt(selectedCategory.value)
    const matchesGender = !selectedGender.value || p.gender_id === parseInt(selectedGender.value)
    return matchesSearch && matchesCategory && matchesGender
  })
})

function openConfirmDelete(product) {
  productToDelete.value = product
  showDeleteConfirm.value = true
}

async function handleDeleteProduct() {
  if (!productToDelete.value) return
  loading.value = true
  try {
    await $fetch(`/api/products/${productToDelete.value.id}`, { method: 'DELETE' })
    showAlert('Produk berhasil dihapus', 'success')
    showDeleteConfirm.value = false
    productToDelete.value = null
    await refresh()
  } catch (err) {
    showAlert(err.data?.statusMessage || 'Terjadi kesalahan', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-8">
    <div class="flex justify-between items-end mb-10">
      <div>
        <h2 class="text-3xl font-serif mb-2">Produk</h2>
        <p class="text-sm text-muted uppercase tracking-widest">Daftar lengkap inventaris mewah Anda.</p>
      </div>
      <NuxtLink to="/admin/manage/product/add" class="btn-luxury flex items-center gap-2">
        <Plus :size="16" />
        Tambah Produk
      </NuxtLink>
    </div>

    <!-- Filter Bar -->
    <div class="mb-8 flex gap-4">
      <div class="flex-1 relative">
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Cari nama produk..." 
          class="w-full bg-white border border-border px-10 py-3 text-sm focus:outline-none focus:border-soft-black transition-colors"
        />
        <Search :size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
      </div>
      <select 
        v-model="selectedCategory"
        class="bg-white border border-border px-6 py-3 text-sm focus:outline-none focus:border-soft-black transition-colors"
      >
        <option value="">Semua Kategori</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <select 
        v-model="selectedGender"
        class="bg-white border border-border px-6 py-3 text-sm focus:outline-none focus:border-soft-black transition-colors"
      >
        <option value="">Semua Gender</option>
        <option v-for="gender in genders" :key="gender.id" :value="gender.id">{{ gender.name }}</option>
      </select>
    </div>

      <div class="bg-white border border-border shadow-sm overflow-hidden" v-motion-fade>
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-border text-[10px] uppercase tracking-widest text-muted bg-neutral-50/50">
              <th class="px-6 py-4 font-bold">Gambar</th>
              <th class="px-6 py-4 font-bold">Nama</th>
              <th class="px-6 py-4 font-bold">Kategori</th>
              <th class="px-6 py-4 font-bold">Gender</th>
              <th class="px-6 py-4 font-bold">Varian</th>
              <th class="px-6 py-4 font-bold">Stok</th>
              <th class="px-6 py-4 font-bold">Harga</th>
              <th class="px-6 py-4 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in filteredProducts" :key="product.id" class="border-b border-border last:border-0 hover:bg-neutral-50 transition-colors group">
              <td class="px-6 py-4">
                <div class="w-12 h-12 bg-neutral-100 border border-border overflow-hidden">
                  <img v-if="product.images?.length" :src="product.images[0]" class="w-full h-full object-cover" />
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="text-sm font-medium">{{ product.name }}</span>
                  <span class="text-[10px] text-muted uppercase tracking-wider">ID: #{{ product.id }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-xs uppercase tracking-widest bg-neutral-100 px-2 py-1 border border-border">{{ product.category_name || 'Tanpa Kategori' }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-xs uppercase tracking-widest bg-neutral-100 px-2 py-1 border border-border">{{ product.gender_name || 'Unisex' }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-xs font-bold text-soft-black">{{ product.variants?.length || 1 }} Varian</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm font-sans" :class="product.stock <= 0 ? 'text-red-500 font-bold' : 'text-soft-black'">
                  {{ product.stock }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-sans font-bold">Rp{{ product.price.toLocaleString('id-ID') }}</span>
                    <span v-if="product.discount > 0" class="text-[8px] bg-red-100 text-red-600 px-1 py-0.5 font-bold rounded">
                      {{ product.discount }}% DISKON
                    </span>
                  </div>
                  <span v-if="product.discount > 0" class="text-[10px] text-muted line-through">
                    Rp{{ product.selling_price.toLocaleString('id-ID') }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-4">
                  <NuxtLink :to="`/admin/manage/product/edit/${product.id}`" class="text-muted hover:text-soft-black transition-colors" title="Ubah"><Pencil :size="16" /></NuxtLink>
                  <button @click="openConfirmDelete(product)" class="text-muted hover:text-red-600 transition-colors" title="Hapus"><Trash2 :size="16" /></button>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredProducts?.length">
              <td colspan="8" class="px-6 py-20 text-center">
                <ShoppingBag :size="48" class="mx-auto text-neutral-200 mb-4" />
                <p class="text-xs text-muted uppercase tracking-widest">Produk tidak ditemukan.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-[70] flex items-center justify-center p-6">
      <div class="absolute inset-0 bg-soft-black/40 backdrop-blur-sm" @click="showDeleteConfirm = false"></div>
      <div class="bg-white w-full max-w-sm relative z-10 p-8 border border-border shadow-2xl text-center" v-motion-pop>
        <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle :size="32" />
        </div>
        <h3 class="text-xl font-serif mb-2 text-soft-black">Konfirmasi Penghapusan</h3>
        <p class="text-sm text-muted font-sans leading-relaxed mb-8">
          Apakah Anda yakin ingin menghapus produk <span class="font-bold text-soft-black">"{{ productToDelete?.name }}"</span>? Tindakan ini tidak dapat dibatalkan.
        </p>
        
        <div class="grid grid-cols-2 gap-4">
          <button 
            @click="showDeleteConfirm = false" 
            class="px-6 py-3 border border-border text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-50 transition-colors"
          >
            Batal
          </button>
          <button 
            @click="handleDeleteProduct" 
            :disabled="loading"
            class="px-6 py-3 bg-red-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Loader2 v-if="loading" :size="14" class="animate-spin" />
            Hapus
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
