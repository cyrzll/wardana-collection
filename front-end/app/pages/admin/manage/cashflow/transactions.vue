<script setup>
import { 
  ArrowRight,
  Search,
  Filter,
  Download,
  CreditCard,
  Wallet
} from 'lucide-vue-next'

definePageMeta({
  layout: 'admin'
})

const { data: transactions, refresh } = await useFetch('/api/admin/cashflow/transactions')

function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatCurrency(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

function getStatusClass(status) {
  switch (status) {
    case 'selesai': return 'bg-green-50 text-green-600'
    case 'batal': return 'bg-red-50 text-red-600'
    case 'dikirim': return 'bg-blue-50 text-blue-600'
    default: return 'bg-neutral-50 text-neutral-600'
  }
}
</script>

<template>
  <div class="p-8 space-y-8">
    <div class="flex justify-between items-end">
      <div>
        <h2 class="text-3xl font-serif mb-2">Riwayat Transaksi</h2>
        <p class="text-[10px] text-muted uppercase tracking-[0.2em]">Log transaksi finansial masuk dan keluar di platform.</p>
      </div>
      <div class="flex gap-4">
        <button class="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold border border-border px-6 py-3 hover:bg-neutral-50 transition-all">
          <Download :size="14" /> Export CSV
        </button>
        <button @click="refresh" class="text-[10px] uppercase tracking-widest font-bold bg-soft-black text-white px-6 py-3 hover:bg-neutral-800 transition-all">
          Refresh
        </button>
      </div>
    </div>

    <!-- Filters & Search Bar -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="md:col-span-2 relative">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-muted" :size="16" />
        <input 
          type="text" 
          placeholder="Cari referensi, pelanggan..." 
          class="w-full pl-12 pr-4 py-4 border border-border text-sm focus:outline-none focus:border-soft-black transition-all"
        />
      </div>
      <div class="relative">
        <Filter class="absolute left-4 top-1/2 -translate-y-1/2 text-muted" :size="16" />
        <select class="w-full pl-12 pr-4 py-4 border border-border text-[10px] uppercase tracking-widest font-bold appearance-none bg-white">
          <option>Semua Tipe</option>
          <option>Pembayaran Order</option>
          <option>Refund Wallet</option>
        </select>
      </div>
      <div class="relative">
        <select class="w-full px-4 py-4 border border-border text-[10px] uppercase tracking-widest font-bold appearance-none bg-white">
          <option>Urutkan: Terbaru</option>
          <option>Terlama</option>
          <option>Nominal Tertinggi</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-border shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-neutral-50 border-b border-border">
              <th class="p-6 text-[10px] uppercase tracking-widest font-bold">Waktu & Ref</th>
              <th class="p-6 text-[10px] uppercase tracking-widest font-bold">Pelanggan</th>
              <th class="p-6 text-[10px] uppercase tracking-widest font-bold">Metode</th>
              <th class="p-6 text-[10px] uppercase tracking-widest font-bold">Status</th>
              <th class="p-6 text-[10px] uppercase tracking-widest font-bold text-right">Nominal</th>
              <th class="p-6 w-10"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="tx in transactions" :key="tx.id" class="hover:bg-neutral-50/50 transition-all group">
              <td class="p-6">
                <p class="text-xs font-bold text-soft-black mb-1">#{{ tx.reference }}</p>
                <p class="text-[10px] text-muted uppercase tracking-widest">{{ formatDate(tx.date) }}</p>
              </td>
              <td class="p-6">
                <p class="text-sm font-medium">{{ tx.customer }}</p>
                <p class="text-[10px] text-muted uppercase tracking-widest">{{ tx.type }}</p>
              </td>
              <td class="p-6">
                <div class="flex items-center gap-2">
                  <component :is="tx.method === 'wardanapay' ? Wallet : CreditCard" :size="14" class="text-muted" />
                  <span class="text-[10px] uppercase tracking-widest font-bold text-muted">{{ tx.method }}</span>
                </div>
              </td>
              <td class="p-6">
                <span class="text-[9px] px-3 py-1 font-bold uppercase tracking-widest" :class="getStatusClass(tx.status)">
                  {{ tx.status }}
                </span>
              </td>
              <td class="p-6 text-right font-mono font-bold text-sm">
                {{ formatCurrency(tx.amount) }}
              </td>
              <td class="p-6">
                <button class="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white rounded-full border border-transparent hover:border-border">
                  <ArrowRight :size="16" />
                </button>
              </td>
            </tr>
            <tr v-if="!transactions?.length">
              <td colspan="6" class="p-12 text-center text-xs text-muted italic uppercase tracking-widest">
                Tidak ada data transaksi yang ditemukan.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination Placeholder -->
      <div class="p-6 border-t border-border flex justify-between items-center bg-neutral-50/30">
        <p class="text-[10px] uppercase tracking-widest text-muted">Menampilkan {{ transactions?.length || 0 }} transaksi</p>
        <div class="flex gap-2">
          <button disabled class="p-3 border border-border bg-white opacity-50 cursor-not-allowed">
            <ArrowRight :size="14" class="rotate-180" />
          </button>
          <button class="p-3 border border-border bg-white hover:bg-neutral-50 transition-all">
            <ArrowRight :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
