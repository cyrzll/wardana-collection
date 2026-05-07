<script setup>
const route = useRoute()
const categoryId = computed(() => route.query.category)
const genderId = computed(() => route.query.gender)

const { data: products } = await useFetch('/api/products', {
  query: {
    category_id: categoryId,
    gender_id: genderId
  },
  watch: [categoryId, genderId]
})

const pageTitle = computed(() => {
  if (products.value && products.value.length > 0) {
    if (categoryId.value) return products.value[0].category_name
    if (genderId.value) return products.value[0].gender_name
  }
  return 'Semua Produk'
})
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <!-- Header Section -->
    <header class="pt-32 pb-10 px-6 max-w-7xl mx-auto">
      <h1 class="text-4xl md:text-5xl font-serif text-soft-black mb-4 capitalize" v-motion-fade>{{ pageTitle }}</h1>
      <p class="text-[10px] md:text-xs text-muted uppercase tracking-[0.4em]" v-motion-fade-visible-once>Jelajahi rangkaian desain teliti kami.</p>
    </header>

    <!-- Product Grid -->
    <main class="max-w-7xl mx-auto px-6 pb-20">
      <div v-if="products && products.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
        <NuxtLink 
          v-for="product in products" 
          :key="product.id"
          :to="`/product/view/${product.id}`"
          class="group block transition-all duration-500 hover:-translate-y-2 cursor-pointer"
          v-motion-slide-visible-once-bottom
        >
          <!-- Product Image Wrapper -->
          <div class="aspect-[3/4] bg-neutral-100 overflow-hidden relative">
            <!-- Discount Tag -->
            <div v-if="product.discount > 0" class="absolute top-4 left-4 bg-soft-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest z-10">
              -{{ product.discount }}%
            </div>
            
            <img 
              v-if="product.images?.length" 
              :src="product.images[0]" 
              :alt="product.name"
              class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-neutral-400 italic text-[10px] uppercase tracking-widest">
              Gambar Tidak Tersedia
            </div>
            
            <!-- Quick Add Overlay (Premium feel) -->
            <div class="absolute inset-0 bg-soft-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center p-6">
              <div class="w-full bg-white text-soft-black py-3 text-center text-[9px] uppercase tracking-[0.2em] font-bold hover:bg-soft-black hover:text-white transition-all duration-300">
                Lihat Koleksi
              </div>
            </div>
          </div>

          <!-- Product Info -->
          <div class="mt-6 space-y-3">
            <div class="flex justify-between items-center">
              <p class="text-[9px] text-muted uppercase tracking-[0.2em]">{{ product.category_name || 'Essentials' }}</p>
              <div v-if="product.sizes?.length" class="flex gap-1.5">
                <span v-for="size in product.sizes.slice(0, 3)" :key="size" class="text-[7px] border border-border px-1.5 py-0.5 uppercase text-soft-black font-bold">{{ size }}</span>
              </div>
            </div>
            <h3 class="text-sm font-serif text-soft-black line-clamp-1 leading-relaxed">{{ product.name }}</h3>
            
            <div class="flex items-center gap-3 pt-1 border-t border-neutral-50">
              <p class="text-sm font-sans font-bold text-soft-black tracking-tight">Rp{{ product.price.toLocaleString('id-ID') }}</p>
              <p v-if="product.discount > 0" class="text-[10px] font-sans text-neutral-400 line-through decoration-red-400/30">
                Rp{{ product.selling_price.toLocaleString('id-ID') }}
              </p>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- Empty State -->
      <div v-else class="py-40 text-center">
        <h3 class="text-xl font-serif text-muted mb-4">Koleksi akan segera hadir</h3>
        <p class="text-xs text-muted uppercase tracking-widest">Daftar untuk pemberitahuan produk terbaru.</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.text-soft-black { color: #1a1a1a; }
.bg-soft-black { background-color: #1a1a1a; }
</style>
