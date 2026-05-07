<script setup>
import { MapPin, Plus, Trash2, Home, Briefcase, Building, Check, AlertCircle, X } from 'lucide-vue-next'

const user = ref(null)
const addresses = ref([])
const loading = ref(true)
const showModal = ref(false)
const modalLoading = ref(false)
const { showAlert } = useAlert()

const form = ref({
  id: null,
  label: '',
  recipient_name: '',
  phone: '',
  province_code: '',
  province_name: '',
  city_code: '',
  city_name: '',
  district_code: '',
  district_name: '',
  village_code: '',
  village_name: '',
  postal_code: '',
  street_address: '',
  is_primary: false
})

const regions = ref({
  provinces: [],
  cities: [],
  districts: [],
  villages: []
})

async function fetchAddresses() {
  if (!user.value) return
  loading.value = true
  try {
    const data = await $fetch('/api/address', { params: { user_id: user.value.id } })
    addresses.value = data
  } catch (e) {
    showAlert('Gagal memuat alamat', 'error')
  } finally {
    loading.value = false
  }
}

async function fetchProvinces() {
  try {
    const res = await $fetch('/api/regions/provinces')
    regions.value.provinces = res.data
  } catch (e) {}
}

async function fetchCities(provinceCode) {
  if (!provinceCode) return
  try {
    const res = await $fetch(`/api/regions/regencies/${provinceCode}`)
    regions.value.cities = res.data
  } catch (e) {}
}

async function fetchDistricts(cityCode) {
  if (!cityCode) return
  try {
    const res = await $fetch(`/api/regions/districts/${cityCode}`)
    regions.value.districts = res.data
  } catch (e) {}
}

async function fetchVillages(districtCode) {
  if (!districtCode) return
  try {
    const res = await $fetch(`/api/regions/villages/${districtCode}`)
    regions.value.villages = res.data
  } catch (e) {}
}

watch(() => form.value.province_code, (newVal) => {
  if (newVal) {
    const p = regions.value.provinces.find(x => x.code === newVal)
    form.value.province_name = p ? p.name : ''
    fetchCities(newVal)
  }
})

watch(() => form.value.city_code, (newVal) => {
  if (newVal) {
    const c = regions.value.cities.find(x => x.code === newVal)
    form.value.city_name = c ? c.name : ''
    fetchDistricts(newVal)
  }
})

watch(() => form.value.district_code, (newVal) => {
  if (newVal) {
    const d = regions.value.districts.find(x => x.code === newVal)
    form.value.district_name = d ? d.name : ''
    fetchVillages(newVal)
  }
})

watch(() => form.value.village_code, (newVal) => {
  if (newVal) {
    const v = regions.value.villages.find(x => x.code === newVal)
    form.value.village_name = v ? v.name : ''
  }
})

function openAddModal() {
  form.value = {
    id: null, label: '', recipient_name: '', phone: '',
    province_code: '', province_name: '', city_code: '', city_name: '',
    district_code: '', district_name: '', village_code: '', village_name: '',
    postal_code: '', street_address: '', is_primary: false
  }
  showModal.value = true
}

async function saveAddress() {
  if (!user.value) return
  modalLoading.value = true
  try {
    const method = form.value.id ? 'PUT' : 'POST'
    const url = form.value.id ? `/api/address/${form.value.id}` : '/api/address'
    
    await $fetch(url, {
      method,
      body: { ...form.value, user_id: user.value.id }
    })
    
    showAlert(form.value.id ? 'Alamat diperbarui' : 'Alamat ditambahkan', 'success')
    showModal.value = false
    fetchAddresses()
  } catch (e) {
    showAlert(e.data?.statusMessage || 'Gagal menyimpan alamat', 'error')
  } finally {
    modalLoading.value = false
  }
}

async function setPrimary(id) {
  try {
    await $fetch('/api/address/set-primary', {
      method: 'POST',
      body: { user_id: user.value.id, address_id: id }
    })
    fetchAddresses()
    showAlert('Alamat utama diperbarui', 'success')
  } catch (e) {}
}

async function deleteAddress(id) {
  if (!confirm('Hapus alamat ini?')) return
  try {
    await $fetch(`/api/address/${id}`, {
      method: 'DELETE',
      params: { user_id: user.value.id }
    })
    fetchAddresses()
    showAlert('Alamat dihapus', 'success')
  } catch (e) {}
}

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('user_info')
    if (saved) {
      user.value = JSON.parse(saved)
      fetchAddresses()
      fetchProvinces()
    } else {
      navigateTo('/auth/login')
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-neutral-50 pt-32 pb-20">
    <div class="max-w-4xl mx-auto px-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-12">
        <div class="mb-4">
          <ButtonBackButton label="Alamat Saya" />
          <p class="text-xs text-muted uppercase tracking-widest mt-4 pl-12">Kelola tujuan pengiriman belanja Anda</p>
        </div>
        <button 
          v-if="addresses.length < 3"
          @click="openAddModal" 
          class="flex items-center gap-2 bg-soft-black text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-soft-black/10"
        >
          <Plus :size="14" />
          Tambah Alamat
        </button>
      </div>

      <!-- Limit Warning -->
      <div v-if="addresses.length >= 3" class="mb-8 p-4 bg-amber-50 border border-amber-100 flex items-center gap-3 text-amber-800 text-xs">
        <AlertCircle :size="16" />
        Anda telah mencapai batas maksimal 3 alamat.
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="w-10 h-10 border-4 border-neutral-200 border-t-soft-black rounded-full animate-spin"></div>
      </div>

      <div v-else-if="addresses.length === 0" class="bg-white border border-border p-20 text-center space-y-6">
        <div class="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto">
          <MapPin :size="32" class="text-neutral-300" />
        </div>
        <div>
          <h2 class="text-xl font-serif text-soft-black">Belum ada alamat</h2>
          <p class="text-sm text-muted mt-2">Tambahkan alamat pengiriman untuk mempermudah proses checkout.</p>
        </div>
        <button @click="openAddModal" class="bg-soft-black text-white px-8 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-colors">
          Tambah Alamat Sekarang
        </button>
      </div>

      <!-- Address List -->
      <div v-else class="space-y-6">
        <div v-for="addr in addresses" :key="addr.id" 
          class="bg-white border transition-all p-8 group relative"
          :class="addr.is_primary ? 'border-soft-black ring-1 ring-soft-black' : 'border-border hover:border-neutral-400'"
        >
          <div v-if="addr.is_primary" class="absolute top-0 right-8 transform -translate-y-1/2">
            <span class="bg-soft-black text-white text-[8px] uppercase tracking-[0.2em] px-4 py-1 font-bold shadow-lg">Utama</span>
          </div>

          <div class="flex justify-between items-start">
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-neutral-100 rounded">
                  <Home v-if="addr.label.toLowerCase() === 'rumah'" :size="16" />
                  <Briefcase v-else-if="addr.label.toLowerCase() === 'kantor'" :size="16" />
                  <Building v-else :size="16" />
                </div>
                <span class="text-xs font-bold uppercase tracking-widest text-soft-black">{{ addr.label }}</span>
              </div>

              <div>
                <p class="font-bold text-soft-black">{{ addr.recipient_name }}</p>
                <p class="text-xs text-muted mt-1">{{ addr.phone }}</p>
              </div>

              <div class="text-sm text-muted leading-relaxed max-w-lg">
                <p>{{ addr.street_address }}</p>
                <p>{{ addr.village_name }}, {{ addr.district_name }}</p>
                <p>{{ addr.city_name }}, {{ addr.province_name }} {{ addr.postal_code }}</p>
              </div>
            </div>

            <div class="flex flex-col items-end gap-4">
              <button @click="deleteAddress(addr.id)" class="text-neutral-300 hover:text-red-500 transition-colors">
                <Trash2 :size="18" />
              </button>
              <button 
                v-if="!addr.is_primary"
                @click="setPrimary(addr.id)" 
                class="text-[10px] uppercase font-bold tracking-widest text-muted hover:text-soft-black underline"
              >
                Set Utama
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <Transition name="fade">
      <div v-if="showModal" class="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-soft-black/20 backdrop-blur-sm overflow-y-auto pt-20">
        <div class="bg-white w-full max-w-2xl shadow-2xl border border-border flex flex-col my-auto">
          <div class="p-8 border-b border-border flex justify-between items-center">
            <div>
              <h2 class="text-xl font-serif text-soft-black">Informasi Alamat</h2>
              <p class="text-[10px] uppercase tracking-widest text-muted mt-1">Lengkapi detail pengiriman Anda</p>
            </div>
            <button @click="showModal = false" class="p-2 hover:bg-neutral-100 rounded-full transition-all">
              <X :size="20" />
            </button>
          </div>

          <div class="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Label -->
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Label Alamat</label>
              <input v-model="form.label" placeholder="Rumah / Kantor / Apartemen" class="w-full p-4 border border-border focus:border-soft-black outline-none text-sm transition-all" />
            </div>

            <!-- Recipient -->
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Nama Penerima</label>
              <input v-model="form.recipient_name" placeholder="Nama Lengkap" class="w-full p-4 border border-border focus:border-soft-black outline-none text-sm transition-all" />
            </div>

            <!-- Phone -->
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Nomor Telepon</label>
              <input v-model="form.phone" placeholder="08xxxx" class="w-full p-4 border border-border focus:border-soft-black outline-none text-sm transition-all" />
            </div>

            <!-- Province -->
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Provinsi</label>
              <select v-model="form.province_code" class="w-full p-4 border border-border focus:border-soft-black outline-none text-sm bg-white">
                <option value="">Pilih Provinsi</option>
                <option v-for="p in regions.provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
              </select>
            </div>

            <!-- City -->
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Kota / Kabupaten</label>
              <select v-model="form.city_code" class="w-full p-4 border border-border focus:border-soft-black outline-none text-sm bg-white" :disabled="!form.province_code">
                <option value="">Pilih Kota</option>
                <option v-for="c in regions.cities" :key="c.code" :value="c.code">{{ c.name }}</option>
              </select>
            </div>

            <!-- District -->
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Kecamatan</label>
              <select v-model="form.district_code" class="w-full p-4 border border-border focus:border-soft-black outline-none text-sm bg-white" :disabled="!form.city_code">
                <option value="">Pilih Kecamatan</option>
                <option v-for="d in regions.districts" :key="d.code" :value="d.code">{{ d.name }}</option>
              </select>
            </div>

            <!-- Village -->
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Kelurahan / Desa</label>
              <select v-model="form.village_code" class="w-full p-4 border border-border focus:border-soft-black outline-none text-sm bg-white" :disabled="!form.district_code">
                <option value="">Pilih Kelurahan</option>
                <option v-for="v in regions.villages" :key="v.code" :value="v.code">{{ v.name }}</option>
              </select>
            </div>

            <!-- Postal Code -->
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Kode Pos</label>
              <input v-model="form.postal_code" placeholder="xxxxx" class="w-full p-4 border border-border focus:border-soft-black outline-none text-sm transition-all" />
            </div>

            <!-- Street Address -->
            <div class="space-y-2 md:col-span-2">
              <label class="text-[10px] uppercase font-bold tracking-widest text-muted">Alamat Lengkap</label>
              <textarea v-model="form.street_address" rows="3" placeholder="Nama jalan, nomor rumah, gedung, dll" class="w-full p-4 border border-border focus:border-soft-black outline-none text-sm transition-all resize-none"></textarea>
            </div>
          </div>

          <div class="p-8 border-t border-border bg-neutral-50 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <input type="checkbox" v-model="form.is_primary" id="is_primary" class="w-4 h-4 accent-soft-black" />
              <label for="is_primary" class="text-xs text-soft-black">Jadikan alamat utama</label>
            </div>
            <button 
              @click="saveAddress" 
              :disabled="modalLoading"
              class="bg-soft-black text-white px-10 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-800 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              <span v-if="modalLoading" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Simpan Alamat
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

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
