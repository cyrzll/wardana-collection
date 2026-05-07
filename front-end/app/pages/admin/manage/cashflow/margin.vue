<script setup>
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  ShoppingBag,
  Package
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

const { data: marginData, refresh } = await useFetch('/api/admin/cashflow/margin')

const stats = computed(() => [
  { 
    label: 'Pendapatan Kotor', 
    value: `Rp${marginData.value?.summary.totalRevenue.toLocaleString('id-ID')}`, 
    icon: DollarSign, 
    color: 'text-soft-black' 
  },
  { 
    label: 'Keuntungan Bersih', 
    value: `Rp${marginData.value?.summary.totalProfit.toLocaleString('id-ID')}`, 
    icon: TrendingUp, 
    color: 'text-green-600' 
  },
  { 
    label: 'Margin (Net)', 
    value: `${marginData.value?.summary.marginPercentage}%`, 
    icon: ArrowUpRight, 
    color: 'text-blue-600' 
  },
  { 
    label: 'Barang Terjual', 
    value: marginData.value?.summary.totalItemsSold || 0, 
    icon: Package, 
    color: 'text-purple-600' 
  },
])

function formatCurrency(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const timeframeOptions = [
  { label: 'Mingguan', value: 'weekly' },
  { label: 'Bulanan', value: 'monthly' },
  { label: 'Tahunan', value: 'yearly' }
]

const activeTimeframe = ref('weekly')

const mainChartData = computed(() => {
  if (!marginData.value?.trends?.[activeTimeframe.value]) return { labels: [], datasets: [] }
  
  const currentTrend = marginData.value.trends[activeTimeframe.value]
  const labels = currentTrend.map(d => d.name)
  const revenueData = currentTrend.map(d => d.revenue)
  const profitData = currentTrend.map(d => d.profit)

  return {
    labels,
    datasets: [
      {
        label: 'Pendapatan Kotor (Gross)',
        backgroundColor: 'rgba(26, 26, 26, 0.05)',
        borderColor: '#1a1a1a',
        data: revenueData,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
      },
      {
        label: 'Keuntungan Bersih (Net)',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        borderColor: '#16a34a',
        data: profitData,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        usePointStyle: true,
        boxWidth: 6,
        font: {
          family: 'sans-serif',
          size: 10
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f3f4f6' },
      border: { display: false },
      ticks: {
        font: { size: 10 },
        callback: (value) => new Intl.NumberFormat('id-ID', { notation: "compact" }).format(value)
      }
    },
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { font: { size: 10 } }
    }
  }
}

const pieData = computed(() => {
  if (!marginData.value?.categories) return { labels: [], datasets: [] }
  return {
    labels: marginData.value.categories.map(c => c.name),
    datasets: [{
      data: marginData.value.categories.map(c => c.value),
      backgroundColor: ['#1a1a1a', '#404040', '#737373', '#a3a3a3', '#d4d4d4'],
      borderWidth: 0
    }]
  }
})

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        font: { size: 10, family: 'sans-serif' }
      }
    }
  }
}
</script>

<template>
  <div class="p-8 space-y-10">
    <div class="flex justify-between items-end">
      <div>
        <h2 class="text-3xl font-serif mb-2">Margin Keuntungan Bersih</h2>
        <p class="text-[10px] text-muted uppercase tracking-[0.2em]">Analisis profitabilitas bersih setelah dikurangi Beban Pokok Penjualan (HPP).</p>
      </div>
      <button @click="refresh" class="text-[10px] uppercase tracking-widest font-bold border border-border px-6 py-3 hover:bg-neutral-50 transition-all">
        Refresh Data
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div v-for="stat in stats" :key="stat.label" class="bg-white p-8 border border-border shadow-sm group hover:border-soft-black transition-all">
        <div class="flex items-start justify-between mb-6">
          <div class="w-12 h-12 bg-neutral-50 flex items-center justify-center group-hover:bg-soft-black group-hover:text-white transition-all">
            <component :is="stat.icon" :size="20" />
          </div>
        </div>
        <p class="text-[10px] text-muted uppercase tracking-[0.3em] font-bold mb-1">{{ stat.label }}</p>
        <h3 class="text-2xl font-serif">{{ stat.value }}</h3>
      </div>
    </div>

    <!-- Comparisons & Charts Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Comparative Stats -->
      <div class="lg:col-span-1 space-y-8">
        <!-- Weekly Comparison -->
        <div class="bg-white border border-border p-8">
          <p class="text-[10px] uppercase tracking-widest text-muted font-bold mb-4">Profit Minggu Ini</p>
          <div class="flex items-end justify-between">
            <h4 class="text-2xl font-serif">Rp{{ marginData?.comparisons?.weekly?.current.toLocaleString('id-ID') }}</h4>
            <div class="flex items-center gap-1 text-[10px] font-bold" :class="marginData?.comparisons?.weekly?.growth >= 0 ? 'text-green-600' : 'text-red-600'">
              <component :is="marginData?.comparisons?.weekly?.growth >= 0 ? ArrowUpRight : ArrowDownRight" :size="14" />
              {{ marginData?.comparisons?.weekly?.growth }}%
            </div>
          </div>
          <p class="text-[9px] text-muted mt-2">vs Rp{{ marginData?.comparisons?.weekly?.previous.toLocaleString('id-ID') }} minggu lalu</p>
        </div>

        <!-- Monthly Comparison -->
        <div class="bg-white border border-border p-8">
          <p class="text-[10px] uppercase tracking-widest text-muted font-bold mb-4">Profit Bulan Ini</p>
          <div class="flex items-end justify-between">
            <h4 class="text-2xl font-serif">Rp{{ marginData?.comparisons?.monthly?.current.toLocaleString('id-ID') }}</h4>
            <div class="flex items-center gap-1 text-[10px] font-bold" :class="marginData?.comparisons?.monthly?.growth >= 0 ? 'text-green-600' : 'text-red-600'">
              <component :is="marginData?.comparisons?.monthly?.growth >= 0 ? ArrowUpRight : ArrowDownRight" :size="14" />
              {{ marginData?.comparisons?.monthly?.growth }}%
            </div>
          </div>
          <p class="text-[9px] text-muted mt-2">vs Rp{{ marginData?.comparisons?.monthly?.previous.toLocaleString('id-ID') }} bulan lalu</p>
        </div>

        <!-- Best Sellers Pie -->
        <div class="bg-white border border-border p-8 h-[250px]">
          <h3 class="text-[10px] uppercase tracking-widest font-bold mb-6">Kategori Terlaris</h3>
          <div class="h-[150px]">
            <Pie v-if="marginData?.categories?.length" :data="pieData" :options="pieOptions" />
            <div v-else class="h-full flex items-center justify-center text-[9px] uppercase tracking-widest text-muted italic">No data</div>
          </div>
        </div>
      </div>

      <!-- Dynamic Trend Chart -->
      <div class="lg:col-span-2 bg-white border border-border p-8">
        <div class="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <h3 class="text-xs uppercase tracking-[0.3em] font-bold">Laporan Pertumbuhan</h3>
          
          <!-- Radio Toggles -->
          <div class="flex bg-neutral-50 p-1 border border-border rounded-lg">
            <button 
              v-for="opt in timeframeOptions" 
              :key="opt.value"
              @click="activeTimeframe = opt.value"
              class="px-4 py-2 text-[9px] uppercase tracking-widest font-bold transition-all rounded-md"
              :class="activeTimeframe === opt.value ? 'bg-white shadow-sm text-soft-black' : 'text-muted hover:text-soft-black'"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="h-[450px]">
          <Line v-if="marginData?.trends?.[activeTimeframe]?.length" :data="mainChartData" :options="chartOptions" />
          <div v-else class="h-full flex items-center justify-center text-xs text-muted italic uppercase tracking-widest">
            Belum ada data untuk periode ini.
          </div>
        </div>
      </div>
    </div>

    <!-- Monthly Report -->
    <div class="bg-white border border-border">
      <div class="p-8 border-b border-border">
        <h3 class="text-xs uppercase tracking-[0.3em] font-bold">Laporan Per Bulan</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-neutral-50 border-b border-border">
              <th class="p-6 text-[10px] uppercase tracking-widest font-bold">Bulan</th>
              <th class="p-6 text-[10px] uppercase tracking-widest font-bold">Pendapatan Kotor</th>
              <th class="p-6 text-[10px] uppercase tracking-widest font-bold">Beban Pokok (HPP)</th>
              <th class="p-6 text-[10px] uppercase tracking-widest font-bold text-green-600">Profit Bersih</th>
              <th class="p-6 text-[10px] uppercase tracking-widest font-bold">Margin (Net)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="month in marginData?.monthly" :key="month.name" class="hover:bg-neutral-50 transition-all">
              <td class="p-6 text-sm font-medium">{{ month.name }}</td>
              <td class="p-6 text-sm font-mono">{{ formatCurrency(month.revenue) }}</td>
              <td class="p-6 text-sm font-mono text-muted">{{ formatCurrency(month.cost) }}</td>
              <td class="p-6 text-sm font-mono font-bold text-green-600">{{ formatCurrency(month.profit) }}</td>
              <td class="p-6">
                <span class="text-[10px] px-3 py-1 bg-green-50 text-green-600 font-bold uppercase tracking-widest">
                  {{ ((month.profit / month.revenue) * 100).toFixed(1) }}%
                </span>
              </td>
            </tr>
            <tr v-if="!marginData?.monthly?.length">
              <td colspan="5" class="p-12 text-center text-xs text-muted italic uppercase tracking-widest">
                Belum ada data penjualan tersedia.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Breakdown Placeholder -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-soft-black text-white p-12 flex flex-col justify-between aspect-[16/7]">
        <h3 class="text-2xl font-serif leading-tight">Insight Bisnis</h3>
        <div>
          <p class="text-xs text-neutral-400 mb-6 max-w-sm">Produk dengan margin tinggi berkontribusi pada pertumbuhan berkelanjutan. Pastikan beban pokok terkendali.</p>
          <div class="flex items-center gap-6">
            <div class="flex flex-col">
              <span class="text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Target Margin</span>
              <span class="text-xl font-serif">30.0%</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Status Saat Ini</span>
              <span class="text-xl font-serif" :class="marginData?.summary.marginPercentage >= 30 ? 'text-green-400' : 'text-red-400'">
                {{ marginData?.summary.marginPercentage }}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="border border-border p-12 flex flex-col justify-center text-center space-y-6">
        <div class="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto">
          <ArrowUpRight :size="30" class="text-soft-black" />
        </div>
        <div>
          <h4 class="text-sm font-serif mb-2">Optimasi Keuntungan</h4>
          <p class="text-[10px] text-muted uppercase tracking-widest leading-relaxed">Gunakan data ini untuk menyesuaikan strategi harga atau menegosiasikan biaya pengadaan dengan supplier.</p>
        </div>
      </div>
    </div>
  </div>
</template>
