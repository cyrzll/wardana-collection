<script setup>
import { Bell, Search } from 'lucide-vue-next'

const user = ref(null)
onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('user_info')
    if (saved) user.value = JSON.parse(saved)
  }
})
</script>

<template>
  <div class="min-h-screen bg-neutral-50 flex">
    <!-- Sidebar extracted to component -->
    <NavbarAdminNavbar />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Shared Header (Top Bar) -->
      <header class="h-20 bg-white border-b border-border px-8 flex items-center justify-between sticky top-0 z-10">
        <div class="relative w-96">
          <input 
            type="text" 
            placeholder="Cari..." 
            class="w-full bg-neutral-100 border-none px-10 py-2 text-sm focus:ring-1 focus:ring-soft-black outline-none"
          />
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        </div>

        <div class="flex items-center gap-6">
          <button class="relative text-neutral-400 hover:text-soft-black transition-colors">
            <Bell :size="20" />
            <span class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <p class="text-xs font-bold uppercase tracking-widest">{{ user?.username || 'Admin' }}</p>
              <p class="text-[10px] text-muted uppercase tracking-wider">{{ user?.level || 'Superuser' }}</p>
            </div>
            <div class="w-10 h-10 bg-neutral-200 border border-border overflow-hidden">
              <img v-if="user?.profile_image" :src="user.profile_image" class="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      <!-- Page Body -->
      <main class="flex-1">
        <slot />
      </main>
    </div>

    <!-- Universal Alert Modal -->
    <ModalAlertModal />
  </div>
</template>
