<script setup>
import { ArrowRight, ShieldCheck, Leaf, Heart } from 'lucide-vue-next'

const products = [
  { id: 1, name: 'The Classic White', price: 'Rp950.000', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop' },
  { id: 2, name: 'Midnight Navy', price: 'Rp1.250.000', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000&auto=format&fit=crop' },
  { id: 3, name: 'Slate Grey', price: 'Rp1.250.000', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop' },
  { id: 4, name: 'Ivory Cream', price: 'Rp950.000', image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?q=80&w=1000&auto=format&fit=crop' }
]
const config = useRuntimeConfig()
</script>

<template>
  <main class="w-full overflow-hidden">
    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center pt-20 overflow-hidden bg-soft-white">
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span class="text-[25vw] font-serif italic text-black/5 leading-none whitespace-nowrap">Kemewahan Esensial</span>
      </div>

      <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        <div v-motion-fade-visible-once="{ initial: { opacity: 0, x: -50 }, enter: { opacity: 1, x: 0, transition: { duration: 1000 } } }">
          <h2 class="text-xs uppercase tracking-[0.5em] text-muted mb-6">Spring Summer 2024</h2>
          <h1 class="text-6xl md:text-8xl font-serif mb-8 leading-tight">
            Seni dalam <br />
            <span class="italic">Kesederhanaan.</span>
          </h1>
          <p class="text-lg text-muted max-w-md mb-10 leading-relaxed">
            Dibuat dari katun Mesir terbaik, kaos kami dirancang untuk menjadi dasar dari lemari pakaian abadi Anda. Tanpa logo, hanya kualitas murni.
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <NuxtLink to="/product/all" class="btn-luxury group flex items-center justify-center gap-3 text-center">
              Belanja Koleksi
              <ArrowRight :size="16" class="group-hover:translate-x-1 transition-transform" />
            </NuxtLink>
            <button class="btn-outline-luxury">Lihat Katalog</button>
          </div>
        </div>

        <div class="relative group" v-motion-fade-visible-once="{ initial: { opacity: 0, scale: 0.9 }, enter: { opacity: 1, scale: 1, transition: { duration: 1200, ease: 'easeOut' } } }">
          <div class="aspect-[4/5] bg-neutral-100 overflow-hidden relative shadow-2xl">
            <img 
              :src="`${config.public.imageBase}/hero-tshirt.png`" 
              alt="Premium Black T-Shirt" 
              class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div class="absolute bottom-6 right-6 bg-white/90 backdrop-blur px-6 py-4 border border-border">
              <p class="text-[10px] uppercase tracking-widest text-muted mb-1">Item Unggulan</p>
              <p class="text-sm font-medium">Signature Black Tee — Rp1.250.000</p>
            </div>
          </div>
          <div class="absolute -top-4 -right-4 w-24 h-24 border-t border-r border-soft-black/20 pointer-events-none"></div>
          <div class="absolute -bottom-4 -left-4 w-24 h-24 border-b border-l border-soft-black/20 pointer-events-none"></div>
        </div>
      </div>
    </section>

    <!-- Featured Collection -->
    <section class="py-24 bg-white">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div v-motion-fade-visible-once>
            <h2 class="text-xs uppercase tracking-[0.5em] text-muted mb-4">Pilihan Terpilih</h2>
            <h3 class="text-4xl md:text-5xl">Koleksi Utama</h3>
          </div>
          <NuxtLink to="/product/all" class="text-xs uppercase tracking-[0.3em] border-b border-soft-black pb-2 hover:opacity-50 transition-opacity">
            Lihat Semua Produk
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          <div 
            v-for="(product, index) in products" 
            :key="product.id"
            class="group"
            v-motion-fade-visible-once="{ initial: { opacity: 0, y: 20 }, enter: { opacity: 1, y: 0, transition: { delay: index * 100 } } }"
          >
            <div class="aspect-[3/4] bg-neutral-100 mb-6 overflow-hidden relative shadow-sm hover:shadow-xl transition-shadow duration-500">
              <img 
                :src="product.image" 
                :alt="product.name" 
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div class="absolute inset-0 bg-soft-black/0 group-hover:bg-soft-black/5 transition-colors duration-300"></div>
              <button class="absolute bottom-0 left-0 w-full bg-soft-black text-white py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 uppercase text-[10px] tracking-widest font-medium">
                Tambah Cepat +
              </button>
            </div>
            <h4 class="text-lg mb-1">{{ product.name }}</h4>
            <p class="text-sm text-muted font-sans uppercase tracking-wider">{{ product.price }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="py-24 bg-soft-black text-white overflow-hidden relative">
      <div class="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

      <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div class="relative" v-motion-fade-visible-once>
          <div class="aspect-square bg-neutral-800 p-12 flex items-center justify-center relative">
            <div class="text-center">
              <span class="text-8xl font-serif italic block mb-4">100%</span>
              <span class="text-xs uppercase tracking-[0.4em] text-neutral-400">Pure Giza Cotton</span>
            </div>
            <div class="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/20"></div>
            <div class="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/20"></div>
          </div>
        </div>

        <div v-motion-fade-visible-once="{ initial: { opacity: 0, x: 50 }, enter: { opacity: 1, x: 0, transition: { duration: 800 } } }">
          <h2 class="text-xs uppercase tracking-[0.5em] text-neutral-400 mb-6">Filosofi Kami</h2>
          <h3 class="text-4xl md:text-5xl mb-8 leading-tight">Kemewahan yang Tenang, <br /><span class="italic text-neutral-300">Kualitas Tanpa Kompromi.</span></h3>
          <p class="text-neutral-400 text-lg mb-12 leading-relaxed">
            Kami percaya bahwa kemewahan sejati tidak diteriakkan; ia dirasakan. Proses kami dimulai di ladang subur Delta Nil dan berakhir dengan pakaian yang semakin baik setiap kali dicuci.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div class="flex items-start gap-4">
              <div class="mt-1">
                <ShieldCheck :size="20" class="text-neutral-300" />
              </div>
              <div>
                <h4 class="text-sm uppercase tracking-widest mb-2 font-sans font-semibold">Garansi Seumur Hidup</h4>
                <p class="text-xs text-neutral-500 leading-relaxed font-sans">Jahitan kami menggunakan teknik double-stitch untuk daya tahan dan retensi bentuk yang tak tertandingi.</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="mt-1">
                <Leaf :size="20" class="text-neutral-300" />
              </div>
              <div>
                <h4 class="text-sm uppercase tracking-widest mb-2 font-sans font-semibold">Sumber Etis</h4>
                <p class="text-xs text-neutral-500 leading-relaxed font-sans">Rantai pasokan 100% terlacak, dari biji hingga rak, memastikan upah yang adil.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
