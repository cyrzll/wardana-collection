<script setup>
import { ArrowLeft, Upload, X, Loader2, Plus, Trash2, ImageIcon } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const route = useRoute()
const { showAlert } = useAlert()
const { data: categories } = await useFetch('/api/categories')
const { data: genders } = await useFetch('/api/genders')
const { data: product } = await useFetch(`/api/products/${route.params.id}`)

const name = ref('')
const description = ref('')
const categoryId = ref('')
const genderId = ref('')
const loading = ref(false)

// Advanced Variant Management
const variants = ref([])

watch(product, (newVal) => {
  if (newVal) {
    name.value = newVal.name
    description.value = newVal.description
    categoryId.value = newVal.category_id
    genderId.value = newVal.gender_id
    
    if (newVal.variants) {
      const parsed = typeof newVal.variants === 'string' ? JSON.parse(newVal.variants) : newVal.variants
      variants.value = Array.isArray(parsed) ? parsed.map(v => ({
        ...v,
        costPrice: v.costPrice || newVal.cost_price || 0,
        discount: v.discount !== undefined ? v.discount : (newVal.discount || 0),
        existingImages: v.images || [],
        selectedImages: [],
        previewImages: []
      })) : []
    } else {
      variants.value = [{
        name: 'Default',
        price: newVal.selling_price || 0,
        costPrice: newVal.cost_price || 0,
        discount: newVal.discount || 0,
        stock: newVal.stock || 0,
        sizes: newVal.sizes || [],
        existingImages: newVal.images || [],
        selectedImages: [],
        previewImages: []
      }]
    }
  }
}, { immediate: true })

function addVariant() {
  variants.value.push({
    name: '',
    price: 0,
    costPrice: 0,
    discount: 0,
    stock: 0,
    sizes: [],
    existingImages: [],
    selectedImages: [],
    previewImages: []
  })
}

function removeVariant(index) {
  if (variants.value.length > 1) {
    variants.value.splice(index, 1)
  }
}

function onVariantFileChange(e, vIndex) {
  const files = Array.from(e.target.files)
  const variant = variants.value[vIndex]
  
  variant.selectedImages = [...variant.selectedImages, ...files]
  
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      variant.previewImages.push(e.target.result)
    }
    reader.readAsDataURL(file)
  })
}

function removeVariantImage(vIndex, imgIndex, isExisting = false) {
  const variant = variants.value[vIndex]
  if (isExisting) {
    variant.existingImages.splice(imgIndex, 1)
  } else {
    variant.selectedImages.splice(imgIndex, 1)
    variant.previewImages.splice(imgIndex, 1)
  }
}

const newSizeInputs = ref([])

function addSize(vIndex) {
  const val = newSizeInputs.value[vIndex]?.trim()
  if (val && !variants.value[vIndex].sizes.includes(val)) {
    variants.value[vIndex].sizes.push(val)
    newSizeInputs.value[vIndex] = ''
  }
}

function removeSize(vIndex, sIndex) {
  variants.value[vIndex].sizes.splice(sIndex, 1)
}

async function handleSubmit() {
  loading.value = true
  const formData = new FormData()
  
  formData.append('name', name.value)
  formData.append('description', description.value)
  formData.append('category_id', categoryId.value)
  formData.append('gender_id', genderId.value)
  
  const variantsToUpload = variants.value.map((v, idx) => ({
    name: v.name,
    price: v.price,
    costPrice: v.costPrice,
    discount: v.discount,
    stock: v.stock,
    sizes: v.sizes,
    existingImages: v.existingImages,
    imageCount: v.selectedImages.length
  }))
  
  formData.append('variants_config', JSON.stringify(variantsToUpload))
  
  variants.value.forEach((v, vIdx) => {
    v.selectedImages.forEach((file, imgIdx) => {
      formData.append(`variant_${vIdx}_image_${imgIdx}`, file)
    })
  })

  try {
    await $fetch(`/api/products/${route.params.id}`, {
      method: 'PUT',
      body: formData
    })
    showAlert('Produk diperbarui dengan harga spesifik varian', 'success')
    navigateTo('/admin/manage/allproduct')
  } catch (err) {
    showAlert(err.data?.statusMessage || 'Terjadi kesalahan', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-50 flex flex-col pb-20">
    <header class="h-20 bg-white border-b border-border px-8 flex items-center justify-between sticky top-0 z-30">
      <div class="flex items-center gap-4">
        <NuxtLink to="/admin/manage/allproduct" class="text-muted hover:text-soft-black transition-colors">
          <ArrowLeft :size="20" />
        </NuxtLink>
        <h1 class="text-xl font-serif">Ubah Produk</h1>
      </div>
      <div class="flex items-center gap-4">
        <button @click="handleSubmit" :disabled="loading" class="btn-luxury flex items-center gap-2 px-8">
          <Loader2 v-if="loading" :size="16" class="animate-spin" />
          Simpan Perubahan
        </button>
      </div>
    </header>

    <main class="max-w-6xl mx-auto w-full p-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div class="lg:col-span-2 space-y-10">
          <!-- Basic Info -->
          <div class="bg-white p-10 border border-border shadow-sm space-y-8">
            <h2 class="text-xs uppercase tracking-[0.3em] font-bold border-b border-border pb-6 flex items-center gap-3">
              <span class="w-2 h-2 bg-soft-black"></span>
              Informasi Utama
            </h2>
            <div class="space-y-6">
              <div>
                <label class="block text-[10px] uppercase tracking-widest font-bold mb-3 text-muted">Nama Produk</label>
                <input v-model="name" type="text" class="w-full border-b border-neutral-200 py-3 focus:outline-none focus:border-soft-black font-sans text-lg" />
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-widest font-bold mb-3 text-muted">Cerita & Deskripsi</label>
                <textarea v-model="description" rows="6" class="w-full border border-neutral-100 p-4 focus:outline-none focus:border-soft-black font-sans text-sm bg-neutral-50"></textarea>
              </div>
            </div>
          </div>

          <!-- Advanced Variants -->
          <div class="space-y-6">
            <div class="flex justify-between items-end">
              <h2 class="text-xs uppercase tracking-[0.3em] font-bold">Varian Produk</h2>
              <button @click="addVariant" class="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 text-soft-black hover:opacity-70 transition-opacity">
                <Plus :size="14" /> Tambah Varian Baru
              </button>
            </div>

            <div v-for="(variant, vIdx) in variants" :key="vIdx" class="bg-white border border-border shadow-sm overflow-hidden" v-motion-slide-visible-once-bottom>
              <div class="bg-neutral-50 px-8 py-4 border-b border-border flex justify-between items-center">
                <div class="flex items-center gap-4">
                  <span class="text-[10px] bg-soft-black text-white px-2 py-0.5 font-bold">#{{ vIdx + 1 }}</span>
                  <input v-model="variant.name" placeholder="Nama Varian" class="bg-transparent border-none focus:ring-0 font-serif text-sm w-64" />
                </div>
                <button v-if="variants.length > 1" @click="removeVariant(vIdx)" class="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 :size="16" />
                </button>
              </div>

              <div class="p-8 space-y-10">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <!-- Variant Details -->
                  <div class="space-y-6">
                    <div class="grid grid-cols-2 gap-6">
                      <div>
                        <label class="block text-[10px] uppercase tracking-widest font-bold mb-2 text-muted">Harga Modal</label>
                        <div class="relative">
                          <span class="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">Rp</span>
                          <input v-model="variant.costPrice" type="number" class="w-full border-b border-neutral-200 pl-6 py-2 focus:outline-none focus:border-soft-black font-sans text-sm" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] uppercase tracking-widest font-bold mb-2 text-muted">Harga Jual</label>
                        <div class="relative">
                          <span class="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">Rp</span>
                          <input v-model="variant.price" type="number" class="w-full border-b border-neutral-200 pl-6 py-2 focus:outline-none focus:border-soft-black font-sans text-sm" />
                        </div>
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                      <div>
                        <label class="block text-[10px] uppercase tracking-widest font-bold mb-2 text-muted">Diskon (%)</label>
                        <div class="relative">
                          <span class="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">%</span>
                          <input v-model="variant.discount" type="number" step="0.1" max="100" class="w-full border-b border-neutral-200 pr-6 py-2 focus:outline-none focus:border-soft-black font-sans text-sm" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-[10px] uppercase tracking-widest font-bold mb-2 text-muted">Stok</label>
                        <input v-model="variant.stock" type="number" class="w-full border-b border-neutral-200 py-2 focus:outline-none focus:border-soft-black font-sans text-sm" />
                      </div>
                    </div>

                    <div class="p-4 bg-neutral-50 border border-dashed border-neutral-200">
                      <div class="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                        <span class="text-muted">Harga Akhir:</span>
                        <span>Rp{{ Math.round(variant.price * (1 - (variant.discount / 100))).toLocaleString('id-ID') }}</span>
                      </div>
                      <div class="flex justify-between text-[10px] uppercase tracking-widest font-bold mt-2">
                        <span class="text-muted">Estimasi Keuntungan:</span>
                        <span :class="(variant.price * (1 - (variant.discount / 100)) - variant.costPrice) >= 0 ? 'text-green-600' : 'text-red-600'">
                          Rp{{ Math.round(variant.price * (1 - (variant.discount / 100)) - variant.costPrice).toLocaleString('id-ID') }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Variant Images -->
                  <div class="space-y-4">
                    <label class="block text-[10px] uppercase tracking-widest font-bold text-muted mb-2">Galeri Varian</label>
                    <div class="grid grid-cols-3 gap-3">
                      <!-- Existing Images -->
                      <div v-for="(img, iIdx) in variant.existingImages" :key="'ex-'+iIdx" class="aspect-square bg-neutral-50 border border-border relative group overflow-hidden">
                        <img :src="img" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <button @click="removeVariantImage(vIdx, iIdx, true)" class="absolute top-1 right-1 bg-white/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X :size="12" />
                        </button>
                      </div>
                      <!-- New Previews -->
                      <div v-for="(img, iIdx) in variant.previewImages" :key="'new-'+iIdx" class="aspect-square bg-neutral-50 border border-border relative group overflow-hidden opacity-70">
                        <img :src="img" class="w-full h-full object-cover" />
                        <button @click="removeVariantImage(vIdx, iIdx)" class="absolute top-1 right-1 bg-white/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X :size="12" />
                        </button>
                      </div>
                      <label class="aspect-square border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-soft-black transition-colors">
                        <ImageIcon :size="20" class="text-neutral-300 mb-1" />
                        <span class="text-[8px] uppercase tracking-tighter font-bold text-neutral-400">Tambah Gambar</span>
                        <input type="file" multiple @change="onVariantFileChange($event, vIdx)" class="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] uppercase tracking-widest font-bold mb-3 text-muted">Ukuran yang Tersedia</label>
                  <div class="flex flex-wrap gap-2 mb-3">
                    <span v-for="(size, sIdx) in variant.sizes" :key="sIdx" class="inline-flex items-center gap-2 bg-neutral-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-border">
                      {{ size }}
                      <button @click="removeSize(vIdx, sIdx)" class="text-muted hover:text-soft-black"><X :size="12" /></button>
                    </span>
                  </div>
                  <div class="flex gap-2 max-w-xs">
                    <input v-model="newSizeInputs[vIdx]" @keyup.enter="addSize(vIdx)" type="text" placeholder="misal: XL" class="flex-1 bg-neutral-50 border border-neutral-200 px-4 py-2 text-[10px] uppercase tracking-widest focus:outline-none focus:border-soft-black" />
                    <button @click="addSize(vIdx)" class="bg-soft-black text-white p-2"><Plus :size="16" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-10">
          <div class="bg-white p-8 border border-border shadow-sm space-y-6">
            <h2 class="text-xs uppercase tracking-[0.2em] font-bold border-b border-border pb-4">Klasifikasi</h2>
            <div class="space-y-6">
              <div>
                <label class="block text-[10px] uppercase tracking-widest font-bold mb-2 text-muted">Kategori Koleksi</label>
                <select v-model="categoryId" class="w-full border-b border-neutral-200 py-3 focus:outline-none focus:border-soft-black bg-white text-sm">
                  <option value="">Pilih Kategori</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] uppercase tracking-widest font-bold mb-2 text-muted">Segmen Gender</label>
                <select v-model="genderId" class="w-full border-b border-neutral-200 py-3 focus:outline-none focus:border-soft-black bg-white text-sm">
                  <option value="">Unisex / Semua</option>
                  <option v-for="gender in genders" :key="gender.id" :value="gender.id">{{ gender.name }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="loading" class="fixed bottom-0 left-0 h-1 bg-soft-black animate-progress z-50"></div>
  </div>
</template>

<style scoped>
@keyframes progress {
  from { width: 0%; }
  to { width: 100%; }
}
.animate-progress {
  animation: progress 2s ease-in-out infinite;
}
</style>
