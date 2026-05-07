<script setup>
import { Bell, Search, Command, ArrowRight } from 'lucide-vue-next'

const user = ref(null)
const searchQuery = ref('')
const isSearchFocused = ref(false)

const searchableItems = [
  { name: 'Dashboard', path: '/admin/dashboard', category: 'Utama' },
  { name: 'Klasifikasi Produk', path: '/admin/manage/category', category: 'Kelola' },
  { name: 'Daftar Produk', path: '/admin/manage/allproduct', category: 'Kelola' },
  { name: 'Voucher & Diskon', path: '/admin/manage/voucers', category: 'Kelola' },
  { name: 'Manajemen Pengguna', path: '/admin/manage/users', category: 'Kelola' },
  { name: 'Pesanan Masuk (Dikemas)', path: '/admin/manage/orders?status=dikemas', category: 'Pesanan' },
  { name: 'Pesanan Dikirim', path: '/admin/manage/orders?status=dikirim', category: 'Pesanan' },
  { name: 'Pesanan Selesai', path: '/admin/manage/orders?status=selesai', category: 'Pesanan' },
  { name: 'Laporan Margin', path: '/admin/manage/cashflow/margin', category: 'Keuangan' },
  { name: 'Riwayat Transaksi', path: '/admin/manage/cashflow/transactions', category: 'Keuangan' },
]

const filteredResults = computed(() => {
  if (!searchQuery.value) return []
  const query = searchQuery.value.toLowerCase()
  return searchableItems.filter(item => 
    item.name.toLowerCase().includes(query) || 
    item.category.toLowerCase().includes(query)
  ).slice(0, 5)
})

function handleSearchSelect(path) {
  searchQuery.value = ''
  isSearchFocused.value = false
  navigateTo(path)
}

function handleSearchEnter() {
  if (filteredResults.value.length > 0) {
    handleSearchSelect(filteredResults.value[0].path)
  }
}

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('user_info')
    if (saved) user.value = JSON.parse(saved)
  }
})
</script>

<template>
  <div class="min-h-screen bg-neutral-50 flex font-poppins">
    <!-- Sidebar extracted to component -->
    <NavbarAdminNavbar />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Shared Header (Top Bar) -->
      <header class="h-20 bg-white border-b border-border px-8 flex items-center justify-between sticky top-0 z-10">
        <div class="relative w-96 group">
          <div class="relative z-30">
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Cari fitur (cth: produk, pesanan...)" 
              @focus="isSearchFocused = true"
              @blur="setTimeout(() => isSearchFocused = false, 200)"
              @keydown.enter="handleSearchEnter"
              class="w-full bg-neutral-100 border-none px-10 py-2.5 text-xs focus:ring-1 focus:ring-soft-black outline-none transition-all duration-300"
              :class="isSearchFocused ? 'bg-white shadow-lg ring-1 ring-neutral-200' : ''"
            />
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            
            <div v-if="!searchQuery" class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40">
              <Command :size="10" />
              <span class="text-[9px] font-bold">K</span>
            </div>
          </div>

          <!-- Search Results Dropdown -->
          <Transition name="slide-fade">
            <div v-if="isSearchFocused && filteredResults.length > 0" class="absolute top-full left-0 right-0 mt-2 bg-white border border-border shadow-2xl z-20 overflow-hidden">
              <div class="p-2 border-b border-neutral-50 bg-neutral-50/50 flex justify-between items-center">
                <span class="text-[9px] uppercase tracking-widest font-bold text-muted">Hasil Pencarian</span>
                <span class="text-[9px] text-muted">{{ filteredResults.length }} item ditemukan</span>
              </div>
              <ul class="max-h-64 overflow-y-auto">
                <li v-for="item in filteredResults" :key="item.path">
                  <button 
                    @click="handleSearchSelect(item.path)"
                    class="w-full text-left px-4 py-3 hover:bg-neutral-50 flex items-center justify-between group/item transition-colors"
                  >
                    <div class="flex flex-col">
                      <span class="text-xs font-bold text-soft-black">{{ item.name }}</span>
                      <span class="text-[9px] uppercase tracking-widest text-muted">{{ item.category }}</span>
                    </div>
                    <ArrowRight :size="12" class="text-neutral-300 group-hover/item:text-soft-black group-hover/item:translate-x-1 transition-all" />
                  </button>
                </li>
              </ul>
            </div>
            <div v-else-if="isSearchFocused && searchQuery" class="absolute top-full left-0 right-0 mt-2 bg-white border border-border shadow-2xl p-8 text-center z-20">
              <Search :size="24" class="mx-auto text-neutral-200 mb-3" />
              <p class="text-xs text-muted">Tidak ada hasil untuk "{{ searchQuery }}"</p>
            </div>
          </Transition>
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

<style scoped>
.font-poppins {
  font-family: 'Poppins', sans-serif;
}

/* Override serif fonts in admin if user wants Poppins everywhere */
:deep(h1), :deep(h2), :deep(h3), :deep(.font-serif) {
  font-family: 'Poppins', sans-serif !important;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
