<script setup>
import { ShoppingBag, Clock, Truck, CheckCircle2, XCircle } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin'
})

const route = useRoute()
const activeStatus = computed(() => route.query.status || 'all')

const statuses = [
  { id: 'all', name: 'Semua', icon: ShoppingBag, path: '/admin/manage/orders' },
  { id: 'dikemas', name: 'Dikemas', icon: Clock, path: '/admin/manage/orders?status=dikemas' },
  { id: 'dikirim', name: 'Dikirim', icon: Truck, path: '/admin/manage/orders?status=dikirim' },
  { id: 'selesai', name: 'Selesai', icon: CheckCircle2, path: '/admin/manage/orders?status=selesai' },
  { id: 'batal', name: 'Dibatalkan', icon: XCircle, path: '/admin/manage/orders?status=batal' },
]
</script>

<template>
  <div class="p-8 space-y-10">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 class="text-3xl font-serif text-soft-black">Manajemen Pesanan</h1>
        <p class="text-xs text-muted uppercase tracking-[0.2em] mt-2">Pantau dan kelola semua transaksi pelanggan</p>
      </div>

      <div class="flex bg-white border border-border p-1 shadow-sm overflow-x-auto no-scrollbar">
        <NuxtLink 
          v-for="status in statuses" 
          :key="status.id"
          :to="status.path"
          class="px-6 py-3 text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap"
          :class="activeStatus === status.id ? 'bg-soft-black text-white' : 'text-muted hover:text-soft-black hover:bg-neutral-50'"
        >
          {{ status.name }}
        </NuxtLink>
      </div>
    </div>

    <!-- Order List Component -->
    <AdminOrderList :status="activeStatus" :key="activeStatus" />
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
