<script setup>
import { 
  Bell, 
  Search,
  Users, 
  Settings, 
  LogOut,
  Tag,
  Box,
  Ticket,
  TrendingUp,
  Banknote,
  ChevronDown,
  ChevronRight
} from 'lucide-vue-next'

const route = useRoute()
const user = ref(null)
const openAccordion = ref(null)

const menuSections = [
  {
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: Settings },
    ]
  },
  {
    title: 'Kelola',
    items: [
      { name: 'Klasifikasi', path: '/admin/manage/category', icon: Tag },
      { name: 'Produk', path: '/admin/manage/allproduct', icon: Box },
      { name: 'Voucher', path: '/admin/manage/voucers', icon: Ticket },
      { name: 'Pengguna', path: '/admin/manage/users', icon: Users },
    ]
  },
  {
    title: 'Pesanan',
    items: [
      { name: 'Dikemas', path: '/admin/manage/orders?status=dikemas', icon: Box },
      { name: 'Dikirim', path: '/admin/manage/orders?status=dikirim', icon: Box },
      { name: 'Selesai', path: '/admin/manage/orders?status=selesai', icon: Box },
      { name: 'Dibatalkan', path: '/admin/manage/orders?status=batal', icon: Box },
    ]
  },
  {
    title: 'Cash Flow',
    items: [
      { name: 'Margin Keuntungan', path: '/admin/manage/cashflow/margin', icon: TrendingUp },
      { name: 'Riwayat Transaksi', path: '/admin/manage/cashflow/transactions', icon: Banknote },
    ]
  }
]

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('user_info')
    if (saved) user.value = JSON.parse(saved)
  }

  // Auto-open accordion based on current route
  const currentIdx = menuSections.findIndex(sec => 
    sec.title && sec.items.some(item => route.fullPath.includes(item.path.split('?')[0]))
  )
  if (currentIdx !== -1) {
    openAccordion.value = currentIdx
  }
})

function handleLogout() {
  if (import.meta.client) {
    localStorage.removeItem('user_info')
  }
  navigateTo('/auth/login')
}

function toggleAccordion(idx) {
  if (openAccordion.value === idx) {
    openAccordion.value = null
  } else {
    openAccordion.value = idx
  }
}
</script>

<template>
  <div class="flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-soft-black text-white flex flex-col sticky top-0 h-screen">
      <div class="p-8">
        <NuxtLink to="/" class="block">
          <h1 class="text-xl font-serif tracking-[0.2em] uppercase">WARDANA</h1>
          <p class="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Panel Admin</p>
        </NuxtLink>
      </div>

      <nav class="flex-1 px-4 py-4 space-y-4">
        <div v-for="(section, idx) in menuSections" :key="idx">
          
          <template v-if="section.title">
            <button 
              @click="toggleAccordion(idx)"
              class="w-full flex items-center justify-between px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-bold transition-colors focus:outline-none"
              :class="openAccordion === idx ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'"
            >
              <span>{{ section.title }}</span>
              <ChevronDown v-if="openAccordion === idx" :size="14" />
              <ChevronRight v-else :size="14" />
            </button>
            
            <div 
              class="grid transition-all duration-500 ease-in-out overflow-hidden"
              :class="openAccordion === idx ? 'grid-rows-[1fr] opacity-100 py-2' : 'grid-rows-[0fr] opacity-0 py-0'"
            >
              <div class="min-h-0">
                <ul class="space-y-1">
                  <li v-for="item in section.items" :key="item.path">
                    <NuxtLink 
                      :to="item.path" 
                      class="flex items-center gap-3 px-4 py-3 transition-colors text-sm uppercase tracking-widest font-medium"
                      :class="route.fullPath === item.path ? 'bg-neutral-800 text-white border-l-2 border-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'"
                    >
                      <component :is="item.icon" :size="16" />
                      {{ item.name }}
                    </NuxtLink>
                  </li>
                </ul>
              </div>
            </div>
          </template>

          <template v-else>
            <ul class="space-y-1 mb-6">
              <li v-for="item in section.items" :key="item.path">
                <NuxtLink 
                  :to="item.path" 
                  class="flex items-center gap-3 px-4 py-3 transition-colors text-sm uppercase tracking-widest font-medium"
                  :class="route.fullPath === item.path ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'"
                >
                  <component :is="item.icon" :size="18" />
                  {{ item.name }}
                </NuxtLink>
              </li>
            </ul>
          </template>

        </div>
      </nav>

      <div class="p-4 border-t border-neutral-800">
        <button 
          @click="handleLogout"
          class="flex items-center gap-3 px-4 py-3 w-full hover:bg-neutral-800 transition-colors text-sm uppercase tracking-widest font-medium text-red-400 hover:text-red-300"
        >
          <LogOut :size="18" />
          Keluar
        </button>
      </div>
    </aside>

  </div>
</template>
