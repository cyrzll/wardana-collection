<script setup>
import { 
  Users, 
  ShoppingBag, 
  Tag,
  Package,
  Layers,
  ClipboardList,
  TrendingUp,
  History,
  ArrowRight,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Percent,
  Wallet
} from 'lucide-vue-next'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js'
import { Line, Pie } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
)

definePageMeta({
  layout: 'admin'
})

const { data: realStats, refresh } = await useFetch('/api/admin/stats')

const stats = computed(() => [
  { label: 'Total Pengguna', value: realStats.value?.totalUsers || '0', icon: Users, color: 'text-blue-600' },
  { label: 'Total Produk', value: realStats.value?.totalProducts || '0', icon: ShoppingBag, color: 'text-green-600' },
  { label: 'Total Kategori', value: realStats.value?.totalCategories || '0', icon: Tag, color: 'text-purple-600' },
])

const orderStatuses = computed(() => [
  { label: 'Dikemas', count: realStats.value?.orderStatusCounts?.dikemas || 0, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
  { label: 'Dikirim', count: realStats.value?.orderStatusCounts?.dikirim || 0, icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Selesai', count: realStats.value?.orderStatusCounts?.selesai || 0, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
  { label: 'Dibatalkan', count: realStats.value?.orderStatusCounts?.dibatalkan || 0, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
])

const chartData = computed(() => {
  if (!realStats.value?.trends) return { labels: [], datasets: [] }
  return {
    labels: realStats.value.trends.map(t => t.label),
    datasets: [
      {
        label: 'Profit Harian',
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.05)',
        data: realStats.value.trends.map(t => t.profit),
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#16a34a'
      }
    ]
  }
})

const pieData = computed(() => {
  if (!realStats.value?.categories) return { labels: [], datasets: [] }
  return {
    labels: realStats.value.categories.map(c => c.name),
    datasets: [{
      data: realStats.value.categories.map(c => c.value),
      backgroundColor: ['#1a1a1a', '#404040', '#737373', '#a3a3a3', '#d4d4d4'],
      borderWidth: 0
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f3f4f6' },
      border: { display: false },
      ticks: {
        font: { size: 9 },
        callback: (value) => new Intl.NumberFormat('id-ID', { notation: "compact" }).format(value)
      }
    },
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { font: { size: 9 } }
    }
  }
}

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        font: { size: 9, family: 'sans-serif' }
      }
    }
  }
}

function formatCurrency(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const adminModules = [
  { title: 'Produk & Stok', description: 'Atur katalog dan pantau gudang.', path: '/admin/manage/product', icon: Package, color: 'bg-orange-50 text-orange-600' },
  { title: 'Pesanan', description: 'Monitor transaksi masuk harian.', path: '/admin/orders', icon: ClipboardList, color: 'bg-blue-50 text-blue-600' },
  { title: 'Analisis Profit', description: 'Laporan margin & pertumbuhan.', path: '/admin/manage/cashflow/margin', icon: TrendingUp, color: 'bg-green-50 text-green-600' },
]
</script>

<template>
  <div class="p-8 space-y-12 pb-20">
    <!-- Header & Today Recap -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
      <div>
        <h2 class="text-4xl font-serif mb-2">Ikhtisar Bisnis</h2>
        <p class="text-[10px] text-muted uppercase tracking-[0.2em]">Pusat kendali operasional WARDANA.</p>
      </div>
      
      <!-- Today's Margin Recap -->
      <div class="flex flex-wrap items-center gap-4">
        <div class="bg-white border border-border p-4 flex items-center gap-6 shadow-sm min-w-[300px]">
          <div class="w-10 h-10 bg-green-50 text-green-600 flex items-center justify-center rounded-sm">
            <Percent :size="20" />
          </div>
          <div class="flex-1">
            <p class="text-[9px] text-muted uppercase tracking-widest font-bold mb-1">Margin Keuntungan Bersih</p>
            <div class="flex items-end justify-between">
              <h4 class="text-xl font-serif">{{ realStats?.todayRecap?.margin }}%</h4>
              <div class="flex flex-col items-end">
                <span class="text-[9px] font-bold text-green-600" title="Profit Bersih setelah dikurangi biaya modal">
                  {{ formatCurrency(realStats?.todayRecap?.profit || 0) }} (Net)
                </span>
                <span class="text-[8px] font-bold uppercase tracking-tighter" :class="realStats?.todayRecap?.profitGrowth >= 0 ? 'text-green-600' : 'text-red-500'">
                  {{ realStats?.todayRecap?.profitGrowth >= 0 ? '+' : '' }}{{ realStats?.todayRecap?.profitGrowth }}% dari kemarin
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-soft-black text-white p-4 flex items-center gap-6 shadow-lg min-w-[300px]">
          <div class="w-10 h-10 bg-white/10 text-white flex items-center justify-center rounded-sm">
            <Wallet :size="20" />
          </div>
          <div class="flex-1">
            <p class="text-[9px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Pendapatan Kotor Hari Ini</p>
            <h4 class="text-xl font-serif">{{ formatCurrency(realStats?.todayRecap?.revenue || 0) }}</h4>
            <p class="text-[7px] text-neutral-500 uppercase tracking-widest mt-1 italic">Total omzet sebelum biaya modal</p>
          </div>
        </div>

        <button @click="refresh" class="w-12 h-12 flex items-center justify-center border border-border hover:bg-neutral-50 transition-all bg-white">
          <History :size="16" class="text-muted" />
        </button>
      </div>
    </div>

    <!-- Main Visuals: Profit Trend & Best Sellers -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- 7-Day Trend Chart -->
      <div class="lg:col-span-2 bg-white border border-border p-8">
        <div class="mb-8 flex justify-between items-center">
          <h3 class="text-xs uppercase tracking-[0.3em] font-bold text-neutral-500">Pertumbuhan Keuntungan Bersih (7 Hari)</h3>
          <NuxtLink to="/admin/manage/cashflow/margin" class="text-[9px] uppercase tracking-widest font-bold underline underline-offset-4 hover:text-green-600">Laporan Detail</NuxtLink>
        </div>
        <div class="h-[300px]">
          <Line v-if="realStats?.trends" :data="chartData" :options="chartOptions" />
          <div v-else class="h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-muted italic">Memuat data tren...</div>
        </div>
      </div>

      <!-- Best Sellers Pie -->
      <div class="lg:col-span-1 bg-white border border-border p-8">
        <h3 class="text-xs uppercase tracking-[0.3em] font-bold text-neutral-500">Volume Penjualan Kategori</h3>
        <div class="h-[300px]">
          <Pie v-if="realStats?.categories?.length" :data="pieData" :options="pieOptions" />
          <div v-else class="h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-muted italic text-center">
            Belum ada data<br/>kategori terjual.
          </div>
        </div>
      </div>
    </div>

    <!-- Order Status Pipeline -->
    <div class="space-y-8">
      <div class="flex items-center justify-between border-b border-border pb-4">
        <h3 class="text-xs uppercase tracking-[0.3em] font-bold">Status Pesanan Saat Ini</h3>
        <NuxtLink to="/admin/orders" class="text-[9px] uppercase tracking-widest font-bold underline underline-offset-4 hover:text-blue-600">Lihat Semua Pesanan</NuxtLink>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="status in orderStatuses" :key="status.label" 
          class="bg-white border border-border p-8 group hover:border-soft-black transition-all cursor-pointer relative overflow-hidden">
          <div :class="[status.bg]" class="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-50 transition-all group-hover:scale-125"></div>
          <div class="relative z-10 space-y-6">
            <div :class="[status.color]" class="w-10 h-10 flex items-center justify-center rounded-sm bg-white border border-border group-hover:bg-soft-black group-hover:text-white group-hover:border-soft-black transition-all">
              <component :is="status.icon" :size="18" />
            </div>
            <div>
              <p class="text-[9px] text-muted uppercase tracking-[0.2em] font-bold mb-1">{{ status.label }}</p>
              <h4 class="text-3xl font-serif">{{ status.count }}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Navigation Modules -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <NuxtLink 
        v-for="module in adminModules" 
        :key="module.path" 
        :to="module.path"
        class="bg-white border border-border p-10 group hover:shadow-2xl hover:shadow-soft-black/5 transition-all duration-500 flex items-center justify-between"
      >
        <div class="flex items-center gap-8">
          <div :class="module.color" class="w-12 h-12 flex items-center justify-center rounded-sm group-hover:scale-110 transition-all">
            <component :is="module.icon" :size="22" />
          </div>
          <div>
            <h4 class="text-md font-serif mb-1">{{ module.title }}</h4>
            <p class="text-[10px] text-muted uppercase tracking-widest leading-relaxed">{{ module.description }}</p>
          </div>
        </div>
        <ArrowRight :size="16" class="text-neutral-300 group-hover:text-soft-black group-hover:translate-x-2 transition-all" />
      </NuxtLink>
    </div>

    <!-- Bottom Stats Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
      <div v-for="stat in stats" :key="stat.label" class="bg-neutral-50 p-8 border border-border flex items-center justify-between">
        <div class="flex flex-col">
          <p class="text-[9px] text-muted uppercase tracking-[0.3em] font-bold mb-2">{{ stat.label }}</p>
          <h3 class="text-2xl font-serif">{{ stat.value }}</h3>
        </div>
        <component :is="stat.icon" :size="32" class="text-neutral-200" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-soft-black { color: #1a1a1a; }
.bg-soft-black { background-color: #1a1a1a; }
</style>
