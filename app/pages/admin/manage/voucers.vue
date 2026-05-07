<script setup>
import { 
  Ticket, Plus, Search, Filter, MoreHorizontal, 
  Trash2, Edit, X, Check, Users, ShoppingBag, 
  Tag, Calendar, Percent, Banknote 
} from 'lucide-vue-next'

definePageMeta({
  layout: 'admin'
})

const { showAlert } = useAlert()
const vouchers = ref([])
const loading = ref(true)
const showModal = ref(false)
const isEditing = ref(false)

const selectors = ref({ users: [], categories: [], products: [] })

const form = ref({
  id: null,
  code: '',
  title: '',
  type: 'harga', // harga, ongkir
  discount_value: 0,
  discount_type: 'percent', // fixed, percent
  min_purchase: 0,
  max_discount: null,
  target_user_type: 'all', // all, specific
  target_users: [],
  target_scope: 'all', // all, category, product
  target_categories: [],
  target_products: [],
  start_date: '',
  end_date: '',
  usage_limit: null,
  status: 'active'
})

async function fetchData() {
  loading.value = true
  try {
    const [vData, sData] = await Promise.all([
      $fetch('/api/vouchers'),
      $fetch('/api/vouchers/selectors')
    ])
    vouchers.value = vData
    selectors.value = sData
  } catch (e) {
    showAlert('Gagal memuat data', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

function resetForm() {
  form.value = {
    id: null,
    code: '',
    title: '',
    type: 'harga',
    discount_value: 0,
    discount_type: 'percent',
    min_purchase: 0,
    max_discount: null,
    target_user_type: 'all',
    target_users: [],
    target_scope: 'all',
    target_categories: [],
    target_products: [],
    start_date: '',
    end_date: '',
    usage_limit: null,
    status: 'active'
  }
}

function openAdd() {
  resetForm()
  isEditing.value = false
  showModal.value = true
}

function openEdit(v) {
  form.value = { ...v }
  // Ensure dates are formatted for input[type=date]
  if (v.start_date) form.value.start_date = new Date(v.start_date).toISOString().split('T')[0]
  if (v.end_date) form.value.end_date = new Date(v.end_date).toISOString().split('T')[0]
  isEditing.value = true
  showModal.value = true
}

async function save() {
  try {
    const url = isEditing.value ? `/api/vouchers/${form.value.id}` : '/api/vouchers'
    const method = isEditing.value ? 'PUT' : 'POST'
    
    await $fetch(url, {
      method,
      body: form.value
    })
    
    showAlert(`Voucher berhasil ${isEditing.value ? 'diperbarui' : 'buat'}`, 'success')
    showModal.value = false
    fetchData()
  } catch (e) {
    showAlert('Gagal menyimpan voucher', 'error')
  }
}

async function remove(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus voucher ini?')) return
  try {
    await $fetch(`/api/vouchers/${id}`, { method: 'DELETE' })
    showAlert('Voucher dihapus', 'success')
    fetchData()
  } catch (e) {
    showAlert('Gagal menghapus', 'error')
  }
}

async function toggleStatus(v) {
  try {
    const newStatus = v.status === 'active' ? 'inactive' : 'active'
    await $fetch(`/api/vouchers/${v.id}`, {
      method: 'PUT',
      body: { ...v, status: newStatus }
    })
    fetchData()
  } catch (e) {}
}

// Multi-select toggle helpers
function toggleTarget(list, id) {
  const idx = list.indexOf(id)
  if (idx > -1) list.splice(idx, 1)
  else list.push(id)
}
</script>

<template>
  <div class="p-8 space-y-8">
    <!-- Header -->
    <div class="flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-serif text-soft-black">Manajemen Voucher</h1>
        <p class="text-sm text-muted mt-1">Kelola penawaran promosi dan diskon pengiriman.</p>
      </div>
      <button @click="openAdd" class="bg-soft-black text-white px-6 py-3 text-[11px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all flex items-center gap-2">
        <Plus :size="16" />
        Voucher Baru
      </button>
    </div>

    <!-- Stats Bar (Optional) -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white p-6 border border-border flex items-center gap-4">
        <div class="w-12 h-12 bg-neutral-50 flex items-center justify-center rounded-full">
          <Ticket :size="20" class="text-soft-black" />
        </div>
        <div>
          <p class="text-[10px] text-muted uppercase tracking-widest">Total Voucher</p>
          <p class="text-xl font-bold">{{ vouchers.length }}</p>
        </div>
      </div>
      <div class="bg-white p-6 border border-border flex items-center gap-4">
        <div class="w-12 h-12 bg-green-50 flex items-center justify-center rounded-full">
          <Check :size="20" class="text-green-600" />
        </div>
        <div>
          <p class="text-[10px] text-muted uppercase tracking-widest">Aktif Sekarang</p>
          <p class="text-xl font-bold">{{ vouchers.filter(v => v.status === 'active').length }}</p>
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white border border-border">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-neutral-50 border-b border-border">
              <th class="p-4 text-[10px] uppercase tracking-widest font-bold">Detail Voucher</th>
              <th class="p-4 text-[10px] uppercase tracking-widest font-bold">Tipe & Nilai</th>
              <th class="p-4 text-[10px] uppercase tracking-widest font-bold">Target</th>
              <th class="p-4 text-[10px] uppercase tracking-widest font-bold text-center">Diklaim</th>
              <th class="p-4 text-[10px] uppercase tracking-widest font-bold text-center">Penggunaan</th>
              <th class="p-4 text-[10px] uppercase tracking-widest font-bold text-center">Status</th>
              <th class="p-4 text-[10px] uppercase tracking-widest font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-if="loading" v-for="i in 3" :key="i" class="animate-pulse">
              <td colspan="7" class="p-8 text-center text-xs text-muted">Memuat data...</td>
            </tr>
            <tr v-else-if="vouchers.length === 0">
              <td colspan="7" class="p-20 text-center text-sm text-muted">Voucher tidak ditemukan. Buat satu untuk memulai.</td>
            </tr>
            <tr v-for="v in vouchers" :key="v.id" class="hover:bg-neutral-50 transition-colors">
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-neutral-100 flex items-center justify-center border border-border">
                    <Ticket :size="16" />
                  </div>
                  <div>
                    <p class="text-xs font-bold uppercase tracking-widest">{{ v.code }}</p>
                    <p class="text-[10px] text-muted italic">{{ v.title }}</p>
                  </div>
                </div>
              </td>
              <td class="p-4">
                <div class="space-y-1">
                  <span class="px-2 py-0.5 bg-neutral-100 text-[9px] uppercase font-bold rounded">
                    {{ v.type === 'harga' ? 'Diskon' : 'Gratis Ongkir' }}
                  </span>
                  <p class="text-xs font-bold">
                    {{ v.discount_type === 'percent' ? v.discount_value + '%' : 'Rp' + v.discount_value.toLocaleString() }}
                  </p>
                  <p class="text-[9px] text-muted">Min: Rp{{ v.min_purchase.toLocaleString() }}</p>
                </div>
              </td>
              <td class="p-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-1.5 text-[9px] text-muted uppercase tracking-widest">
                    <Users :size="10" />
                    {{ v.target_user_type === 'all' ? 'Semua Pengguna' : v.target_users.length + ' Spesifik' }}
                  </div>
                  <div class="flex items-center gap-1.5 text-[9px] text-muted uppercase tracking-widest">
                    <ShoppingBag :size="10" />
                    {{ v.target_scope === 'all' ? 'Semua Produk' : (v.target_scope === 'category' ? v.target_categories.length + ' Kategori' : v.target_products.length + ' Produk') }}
                  </div>
                </div>
              </td>
              <td class="p-4 text-center">
                <div class="space-y-1">
                  <p class="text-xs font-bold text-soft-black">{{ v.claim_count || 0 }}</p>
                  <p class="text-[9px] text-muted uppercase">Pengguna</p>
                </div>
              </td>
              <td class="p-4 text-center">
                <div class="space-y-1">
                  <p class="text-xs font-medium">{{ v.used_count }} / {{ v.usage_limit || '∞' }}</p>
                  <p class="text-[9px] text-muted uppercase">Kali Digunakan</p>
                  <p v-if="v.end_date" class="text-[9px] text-muted uppercase mt-1">Berakhir: {{ new Date(v.end_date).toLocaleDateString('id-ID') }}</p>
                </div>
              </td>
              <td class="p-4 text-center">
                <button @click="toggleStatus(v)" :class="v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-3 py-1 rounded-full text-[9px] font-bold uppercase">
                  {{ v.status === 'active' ? 'Aktif' : 'Nonaktif' }}
                </button>
              </td>
              <td class="p-4 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="openEdit(v)" class="p-2 text-muted hover:text-soft-black hover:bg-neutral-100 transition-all rounded">
                    <Edit :size="14" />
                  </button>
                  <button @click="remove(v.id)" class="p-2 text-muted hover:text-red-500 hover:bg-red-50 transition-all rounded">
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <Transition name="fade">
      <div v-if="showModal" class="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-soft-black/20 backdrop-blur-sm">
        <div class="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-border">
          <!-- Modal Header -->
          <div class="p-6 border-b border-border flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 class="text-xl font-serif">{{ isEditing ? 'Ubah Voucher' : 'Buat Voucher Baru' }}</h2>
            <button @click="showModal = false" class="p-2 hover:bg-neutral-100 transition-all rounded-full">
              <X :size="20" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-8 overflow-y-auto space-y-8 custom-scrollbar">
            <!-- Basic Info -->
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Kode Voucher</label>
                <input v-model="form.code" type="text" placeholder="misal: SUMMER50" class="w-full p-4 bg-neutral-50 border border-border focus:border-soft-black outline-none transition-all font-mono uppercase" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Judul Tampilan</label>
                <input v-model="form.title" type="text" placeholder="misal: Diskon Musim Panas 50%" class="w-full p-4 bg-neutral-50 border border-border focus:border-soft-black outline-none transition-all" />
              </div>
            </div>

            <!-- Type & Value -->
            <div class="grid grid-cols-3 gap-6 pt-6 border-t border-border">
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Tipe Voucher</label>
                <div class="flex gap-2">
                  <button @click="form.type = 'harga'" :class="form.type === 'harga' ? 'bg-soft-black text-white' : 'bg-neutral-50 border border-border text-muted'" class="flex-1 py-3 text-[9px] uppercase font-bold tracking-widest transition-all">Diskon</button>
                  <button @click="form.type = 'ongkir'" :class="form.type === 'ongkir' ? 'bg-soft-black text-white' : 'bg-neutral-50 border border-border text-muted'" class="flex-1 py-3 text-[9px] uppercase font-bold tracking-widest transition-all">Ongkir</button>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Nilai Diskon</label>
                <div class="flex border border-border">
                  <input v-model="form.discount_value" type="number" class="flex-1 p-3 bg-neutral-50 outline-none text-sm" />
                  <select v-model="form.discount_type" class="bg-neutral-100 px-3 py-3 text-[9px] uppercase font-bold border-l border-border outline-none">
                    <option value="percent">% Diskon</option>
                    <option value="fixed">Tetap</option>
                  </select>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Batas Penggunaan</label>
                <input v-model="form.usage_limit" type="number" placeholder="∞" class="w-full p-4 bg-neutral-50 border border-border focus:border-soft-black outline-none transition-all text-sm" />
              </div>
            </div>

            <!-- Restrictions -->
            <div class="grid grid-cols-3 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Min Belanja (Rp)</label>
                <input v-model="form.min_purchase" type="number" class="w-full p-4 bg-neutral-50 border border-border focus:border-soft-black outline-none transition-all text-sm" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Maks Diskon (Rp)</label>
                <input v-model="form.max_discount" type="number" placeholder="Tidak ada batas" class="w-full p-4 bg-neutral-50 border border-border focus:border-soft-black outline-none transition-all text-sm" />
              </div>
              <div class="space-y-2 flex flex-col">
                <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Status</label>
                <div class="flex-1 flex gap-2 pt-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" v-model="form.status" value="active" />
                    <span class="text-xs uppercase font-bold">Aktif</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" v-model="form.status" value="inactive" />
                    <span class="text-xs uppercase font-bold">Nonaktif</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Targeting Section -->
            <div class="space-y-6 pt-6 border-t border-border">
              <h3 class="text-xs uppercase font-bold tracking-widest flex items-center gap-2">
                <Users :size="14" />
                Target Pengguna
              </h3>
              <div class="flex gap-4">
                <button @click="form.target_user_type = 'all'" :class="form.target_user_type === 'all' ? 'border-soft-black bg-neutral-50' : 'border-border text-muted'" class="flex-1 p-6 border transition-all text-left">
                  <p class="text-[10px] uppercase font-bold mb-1">Semua Pengguna Terdaftar</p>
                  <p class="text-[9px]">Siapa pun dengan akun dapat menggunakan ini.</p>
                </button>
                <button @click="form.target_user_type = 'specific'" :class="form.target_user_type === 'specific' ? 'border-soft-black bg-neutral-50' : 'border-border text-muted'" class="flex-1 p-6 border transition-all text-left">
                  <p class="text-[10px] uppercase font-bold mb-1">Pengguna Spesifik</p>
                  <p class="text-[9px]">Hanya pengguna terpilih yang dapat menggunakan voucher ini.</p>
                </button>
              </div>

              <!-- Specific User Selector -->
              <div v-if="form.target_user_type === 'specific'" class="p-4 bg-neutral-50 border border-border max-h-48 overflow-y-auto">
                <div class="grid grid-cols-2 gap-2">
                  <label v-for="user in selectors.users" :key="user.id" class="flex items-center gap-3 p-2 hover:bg-white rounded transition-colors cursor-pointer border border-transparent hover:border-border">
                    <input type="checkbox" :checked="form.target_users.includes(user.id)" @change="toggleTarget(form.target_users, user.id)" />
                    <div>
                      <p class="text-[10px] font-bold">{{ user.username }}</p>
                      <p class="text-[9px] text-muted">{{ user.email }}</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Scope Section -->
            <div class="space-y-6 pt-6 border-t border-border">
              <h3 class="text-xs uppercase font-bold tracking-widest flex items-center gap-2">
                <ShoppingBag :size="14" />
                Cakupan Voucher
              </h3>
              <div class="flex gap-4">
                <button v-for="scope in ['all', 'category', 'product']" :key="scope" @click="form.target_scope = scope" :class="form.target_scope === scope ? 'border-soft-black bg-neutral-50' : 'border-border text-muted'" class="flex-1 p-4 border transition-all uppercase text-[10px] font-bold">
                  {{ scope === 'all' ? 'Semua' : (scope === 'category' ? 'Kategori' : 'Produk') }}
                </button>
              </div>

              <!-- Category Selector -->
              <div v-if="form.target_scope === 'category'" class="grid grid-cols-4 gap-3">
                <button v-for="cat in selectors.categories" :key="cat.id" @click="toggleTarget(form.target_categories, cat.id)" :class="form.target_categories.includes(cat.id) ? 'bg-soft-black text-white border-soft-black' : 'bg-neutral-50 border-border text-muted'" class="p-3 border text-[9px] uppercase font-bold transition-all">
                  {{ cat.name }}
                </button>
              </div>

              <!-- Product Selector -->
              <div v-if="form.target_scope === 'product'" class="p-4 bg-neutral-50 border border-border max-h-48 overflow-y-auto">
                <div class="grid grid-cols-2 gap-2">
                  <label v-for="prod in selectors.products" :key="prod.id" class="flex items-center gap-3 p-2 hover:bg-white rounded transition-colors cursor-pointer border border-transparent hover:border-border">
                    <input type="checkbox" :checked="form.target_products.includes(prod.id)" @change="toggleTarget(form.target_products, prod.id)" />
                    <span class="text-[10px] font-bold uppercase truncate">{{ prod.name }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Dates -->
            <div class="grid grid-cols-2 gap-6 pt-6 border-t border-border">
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Tanggal Mulai</label>
                <input v-model="form.start_date" type="date" class="w-full p-4 bg-neutral-50 border border-border focus:border-soft-black outline-none transition-all" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Tanggal Berakhir</label>
                <input v-model="form.end_date" type="date" class="w-full p-4 bg-neutral-50 border border-border focus:border-soft-black outline-none transition-all" />
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-6 border-t border-border flex justify-end gap-4 bg-white">
            <button @click="showModal = false" class="px-8 py-4 text-[10px] uppercase tracking-widest font-bold border border-border hover:bg-neutral-50 transition-all">Batal</button>
            <button @click="save" class="px-10 py-4 bg-soft-black text-white text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all shadow-lg shadow-soft-black/10">
              {{ isEditing ? 'Perbarui Voucher' : 'Buat Voucher' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.text-soft-black { color: #1a1a1a; }
.bg-soft-black { background-color: #1a1a1a; }

.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #1a1a1a;
}
</style>
