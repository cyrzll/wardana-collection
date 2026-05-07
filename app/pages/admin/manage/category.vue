<script setup>
import { Plus, Pencil, Trash2, Loader2, X, Search, AlertTriangle } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin'
})

const { showAlert } = useAlert()
const { data: categories, refresh: refreshCategories } = await useFetch('/api/categories')
const { data: genders, refresh: refreshGenders } = await useFetch('/api/genders')

const loading = ref(false)
const showModal = ref(false)
const modalType = ref('') // 'category' or 'gender'
const editingItem = ref(null)
const itemName = ref('')

// Search states
const categorySearch = ref('')
const genderSearch = ref('')

// Delete confirmation states
const showDeleteConfirm = ref(false)
const itemToDelete = ref(null)

const filteredCategories = computed(() => {
  if (!categories.value) return []
  return categories.value.filter(cat => 
    cat.name.toLowerCase().includes(categorySearch.value.toLowerCase())
  )
})

const filteredGenders = computed(() => {
  if (!genders.value) return []
  return genders.value.filter(gender => 
    gender.name.toLowerCase().includes(genderSearch.value.toLowerCase())
  )
})

async function handleSubmit() {
  loading.value = true
  const endpoint = modalType.value === 'category' ? '/api/categories' : '/api/genders'
  
  try {
    if (editingItem.value) {
      await $fetch(`${endpoint}/${editingItem.value.id}`, {
        method: 'PUT',
        body: { name: itemName.value }
      })
      showAlert(`${modalType.value === 'category' ? 'Kategori' : 'Gender'} berhasil diperbarui`, 'success')
    } else {
      await $fetch(endpoint, {
        method: 'POST',
        body: { name: itemName.value }
      })
      showAlert(`${modalType.value === 'category' ? 'Kategori' : 'Gender'} berhasil dibuat`, 'success')
    }
    
    itemName.value = ''
    showModal.value = false
    editingItem.value = null
    
    if (modalType.value === 'category') await refreshCategories()
    else await refreshGenders()
    
  } catch (err) {
    showAlert(err.data?.statusMessage || 'An error occurred', 'error')
  } finally {
    loading.value = false
  }
}

function openConfirmDelete(id, type) {
  const item = type === 'category' 
    ? categories.value.find(c => c.id === id) 
    : genders.value.find(g => g.id === id)
    
  itemToDelete.value = { id, type, name: item?.name }
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!itemToDelete.value) return
  loading.value = true
  const { id, type } = itemToDelete.value
  const endpoint = type === 'category' ? '/api/categories' : '/api/genders'
  
  try {
    await $fetch(`${endpoint}/${id}`, { method: 'DELETE' })
    if (type === 'category') await refreshCategories()
    else await refreshGenders()
    
    showAlert(`${type === 'category' ? 'Kategori' : 'Gender'} berhasil dihapus`, 'success')
    showDeleteConfirm.value = false
    itemToDelete.value = null
  } catch (err) {
    showAlert(err.data?.statusMessage || 'An error occurred', 'error')
  } finally {
    loading.value = false
  }
}

function openEdit(item, type) {
  modalType.value = type
  editingItem.value = item
  itemName.value = item.name
  showModal.value = true
}

function openAdd(type) {
  modalType.value = type
  editingItem.value = null
  itemName.value = ''
  showModal.value = true
}
</script>

<template>
  <div class="p-8 space-y-16">
    <!-- Header -->
    <div class="mb-10">
      <h2 class="text-3xl font-serif mb-2">Klasifikasi</h2>
      <p class="text-sm text-muted uppercase tracking-widest">Kelola kategori produk dan segmen gender Anda dalam satu tempat.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <!-- Categories Table -->
      <section>
        <div class="flex justify-between items-end mb-6">
          <div>
            <h3 class="text-xl font-serif">Kategori Produk</h3>
            <p class="text-[10px] text-muted uppercase tracking-widest mt-1">Tipe koleksi global</p>
          </div>
          <button @click="openAdd('category')" class="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 hover:text-soft-black transition-colors">
            <Plus :size="14" />
            Tambah Kategori
          </button>
        </div>

        <div class="mb-4 relative">
          <input 
            v-model="categorySearch"
            type="text" 
            placeholder="Cari kategori..." 
            class="w-full bg-white border border-border px-10 py-2 text-xs focus:outline-none focus:border-soft-black transition-colors"
          />
          <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        </div>

        <div class="bg-white border border-border shadow-sm overflow-hidden">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-border text-[10px] uppercase tracking-widest text-muted bg-neutral-50/50">
                <th class="px-6 py-4 font-bold">ID</th>
                <th class="px-6 py-4 font-bold">Nama</th>
                <th class="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in filteredCategories" :key="cat.id" class="border-b border-border last:border-0 hover:bg-neutral-50 transition-colors">
                <td class="px-6 py-4 text-xs font-sans text-muted">#{{ cat.id }}</td>
                <td class="px-6 py-4 text-sm font-medium">{{ cat.name }}</td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-4">
                    <button @click="openEdit(cat, 'category')" class="text-muted hover:text-soft-black transition-colors"><Pencil :size="14" /></button>
                    <button @click="openConfirmDelete(cat.id, 'category')" class="text-muted hover:text-red-600 transition-colors"><Trash2 :size="14" /></button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredCategories?.length">
                <td colspan="3" class="px-6 py-12 text-center text-muted uppercase tracking-widest text-[10px]">Kategori tidak ditemukan.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Genders Table -->
      <section>
        <div class="flex justify-between items-end mb-6">
          <div>
            <h3 class="text-xl font-serif">Segmen Gender</h3>
            <p class="text-[10px] text-muted uppercase tracking-widest mt-1">Klasifikasi target audiens</p>
          </div>
          <button @click="openAdd('gender')" class="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 hover:text-soft-black transition-colors">
            <Plus :size="14" />
            Tambah Gender
          </button>
        </div>

        <div class="mb-4 relative">
          <input 
            v-model="genderSearch"
            type="text" 
            placeholder="Cari gender..." 
            class="w-full bg-white border border-border px-10 py-2 text-xs focus:outline-none focus:border-soft-black transition-colors"
          />
          <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        </div>

        <div class="bg-white border border-border shadow-sm overflow-hidden">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-border text-[10px] uppercase tracking-widest text-muted bg-neutral-50/50">
                <th class="px-6 py-4 font-bold">ID</th>
                <th class="px-6 py-4 font-bold">Nama</th>
                <th class="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="gender in filteredGenders" :key="gender.id" class="border-b border-border last:border-0 hover:bg-neutral-50 transition-colors">
                <td class="px-6 py-4 text-xs font-sans text-muted">#{{ gender.id }}</td>
                <td class="px-6 py-4 text-sm font-medium">{{ gender.name }}</td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-4">
                    <button @click="openEdit(gender, 'gender')" class="text-muted hover:text-soft-black transition-colors"><Pencil :size="14" /></button>
                    <button @click="openConfirmDelete(gender.id, 'gender')" class="text-muted hover:text-red-600 transition-colors"><Trash2 :size="14" /></button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredGenders?.length">
                <td colspan="3" class="px-6 py-12 text-center text-muted uppercase tracking-widest text-[10px]">Gender tidak ditemukan.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div class="absolute inset-0 bg-soft-black/40 backdrop-blur-sm" @click="showModal = false"></div>
      <div class="bg-white w-full max-w-md relative z-10 p-10 border border-border shadow-2xl" v-motion-fade>
        <button @click="showModal = false" class="absolute top-4 right-4 text-muted hover:text-soft-black transition-colors"><X :size="20" /></button>
        <h3 class="text-2xl font-serif mb-6">
          {{ editingItem ? 'Ubah' : 'Baru' }} {{ modalType === 'category' ? 'Kategori' : 'Gender' }}
        </h3>
        
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label class="block text-[10px] uppercase tracking-widest font-bold mb-2">
              Nama {{ modalType === 'category' ? 'Kategori' : 'Gender' }}
            </label>
            <input 
              v-model="itemName"
              type="text" 
              required
              class="w-full border border-border px-4 py-3 focus:outline-none focus:border-soft-black transition-colors font-sans text-sm bg-neutral-50 focus:bg-white"
              :placeholder="modalType === 'category' ? 'e.g. Essentials' : 'e.g. Male'"
            />
          </div>
          <button type="submit" :disabled="loading" class="w-full btn-luxury flex items-center justify-center gap-3">
            <Loader2 v-if="loading" :size="16" class="animate-spin" />
            {{ editingItem ? 'Perbarui' : 'Buat' }} {{ modalType === 'category' ? 'Kategori' : 'Gender' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div class="absolute inset-0 bg-soft-black/40 backdrop-blur-sm" @click="showDeleteConfirm = false"></div>
      <div class="bg-white w-full max-w-sm relative z-10 p-8 border border-border shadow-2xl text-center" v-motion-pop>
        <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle :size="32" />
        </div>
        <h3 class="text-xl font-serif mb-2 text-soft-black">Konfirmasi Penghapusan</h3>
        <p class="text-sm text-muted font-sans leading-relaxed mb-8">
          Apakah Anda yakin ingin menghapus <span class="font-bold text-soft-black">"{{ itemToDelete?.name }}"</span>? Tindakan ini tidak dapat dibatalkan.
        </p>
        
        <div class="grid grid-cols-2 gap-4">
          <button 
            @click="showDeleteConfirm = false" 
            class="px-6 py-3 border border-border text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-50 transition-colors"
          >
            Batal
          </button>
          <button 
            @click="handleDelete" 
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
