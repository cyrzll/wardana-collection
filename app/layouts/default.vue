<script setup>
import { 
  Instagram, 
  Twitter, 
  Facebook 
} from 'lucide-vue-next'
</script>

<template>
  <div class="selection:bg-soft-black selection:text-white min-h-screen flex flex-col">
    <NavbarUserNavbar />

    <!-- Page Body -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white pt-24 pb-12 border-t border-border">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div class="lg:col-span-1">
            <a href="/" class="text-xl font-serif tracking-[0.2em] uppercase mb-8 block">WARDANA</a>
            <p class="text-sm text-muted leading-relaxed max-w-xs">
              Defining modern luxury through minimal design and maximum quality. Based in Paris, shipping worldwide.
            </p>
          </div>

          <div>
            <h4 class="text-xs uppercase tracking-[0.3em] font-sans font-bold mb-6 text-soft-black">Collections</h4>
            <ul class="space-y-4">
              <li><NuxtLink to="/product/all" class="text-sm text-muted hover:text-soft-black transition-colors">Men's Essentials</NuxtLink></li>
              <li><NuxtLink to="/product/all" class="text-sm text-muted hover:text-soft-black transition-colors">Women's Essentials</NuxtLink></li>
              <li><NuxtLink to="/product/all" class="text-sm text-muted hover:text-soft-black transition-colors">Limited Releases</NuxtLink></li>
              <li><NuxtLink to="/product/all" class="text-sm text-muted hover:text-soft-black transition-colors">Accessories</NuxtLink></li>
            </ul>
          </div>

          <div>
            <h4 class="text-xs uppercase tracking-[0.3em] font-sans font-bold mb-6 text-soft-black">Support</h4>
            <ul class="space-y-4">
              <li><a href="#" class="text-sm text-muted hover:text-soft-black transition-colors">Shipping & Returns</a></li>
              <li><a href="#" class="text-sm text-muted hover:text-soft-black transition-colors">Size Guide</a></li>
              <li><a href="#" class="text-sm text-muted hover:text-soft-black transition-colors">Sustainability</a></li>
              <li><a href="#" class="text-sm text-muted hover:text-soft-black transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 class="text-xs uppercase tracking-[0.3em] font-sans font-bold mb-6 text-soft-black">Join the Circle</h4>
            <p class="text-xs text-muted mb-6 font-sans">Receive early access to collections and exclusive stories.</p>
            <div class="relative">
              <input 
                type="email" 
                placeholder="Email address" 
                class="w-full border-b border-soft-black py-2 pr-10 focus:outline-none text-sm font-sans"
              />
              <button class="absolute right-0 top-1/2 -translate-y-1/2 text-xs uppercase tracking-widest font-bold">Join</button>
            </div>
          </div>
        </div>

        <div class="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-border gap-6">
          <p class="text-[10px] uppercase tracking-widest text-muted">© 2024 WARDANA. ALL RIGHTS RESERVED.</p>
          <div class="flex space-x-6">
            <a href="#" class="text-muted hover:text-soft-black transition-colors"><Instagram :size="18" /></a>
            <a href="#" class="text-muted hover:text-soft-black transition-colors"><Twitter :size="18" /></a>
            <a href="#" class="text-muted hover:text-soft-black transition-colors"><Facebook :size="18" /></a>
          </div>
        </div>
      </div>
    </footer>

    <!-- Universal Alert Modal -->
    <ModalAlertModal />
  </div>
</template>