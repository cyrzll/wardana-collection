<script setup>
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Shield, 
  User as UserIcon,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  AlertTriangle,
  Wallet
} from 'lucide-vue-next'

definePageMeta({
  layout: 'admin'
})

const { showAlert } = useAlert()
const users = ref([])
const search = ref('')
const loading = ref(false)
const showModal = ref(false)
const isEditing = ref(false)

// Delete confirmation states
const showDeleteConfirm = ref(false)
const userToDelete = ref(null)

const form = ref({
  id: null,
  username: '',
  email: '',
  password: '',
  level: 'user',
  status: 'active'
})

// Wallet Management States
const showWalletModal = ref(false)
const selectedUserForWallet = ref(null)
const walletForm = ref({
  balance: 0,
  pin: '',
  topupAmount: 0
})

async function fetchUsers() {
  loading.value = true
  try {
    users.value = await $fetch('/api/users')
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const filteredUsers = computed(() => {
  if (!search.value) return users.value
  return users.value.filter(u => 
    u.username.toLowerCase().includes(search.value.toLowerCase()) || 
    u.email.toLowerCase().includes(search.value.toLowerCase())
  )
})

function openAddModal() {
  isEditing.value = false
  form.value = { id: null, username: '', email: '', password: '', level: 'user', status: 'active' }
  showModal.value = true
}

function openEditModal(user) {
  isEditing.value = true
  form.value = { ...user, password: '' }
  showModal.value = true
}

function openWalletModal(user) {
  selectedUserForWallet.value = user
  walletForm.value = {
    balance: user.wallet?.balance || 0,
    pin: '', // Keep empty for security
    topupAmount: 0
  }
  showWalletModal.value = true
}

async function handleSubmit() {
  loading.value = true
  try {
    if (isEditing.value) {
      await $fetch(`/api/users/${form.value.id}`, {
        method: 'PUT',
        body: form.value
      })
      showAlert('Pengguna berhasil diperbarui', 'success')
    } else {
      await $fetch('/api/users', {
        method: 'POST',
        body: form.value
      })
      showAlert('Pengguna berhasil dibuat', 'success')
    }
    showModal.value = false
    await fetchUsers()
  } catch (err) {
    showAlert(err.data?.statusMessage || 'Operasi gagal', 'error')
  } finally {
    loading.value = false
  }
}

async function handleUpdateWallet() {
  loading.value = true
  try {
    const finalBalance = parseFloat(walletForm.value.balance) + parseFloat(walletForm.value.topupAmount || 0)
    await $fetch('/api/admin/users/wallet', {
      method: 'PUT',
      body: {
        user_id: selectedUserForWallet.value.id,
        balance: finalBalance,
        pin: walletForm.value.pin || undefined
      }
    })
    showAlert('Dompet berhasil diperbarui', 'success')
    showWalletModal.value = false
    await fetchUsers()
  } catch (err) {
    showAlert(err.data?.statusMessage || 'Gagal memperbarui saldo', 'error')
  } finally {
    loading.value = false
  }
}

function openConfirmDelete(user) {
  userToDelete.value = user
  showDeleteConfirm.value = true
}

async function handleDeleteUser() {
  if (!userToDelete.value) return
  loading.value = true
  try {
    await $fetch(`/api/users/${userToDelete.value.id}`, { method: 'DELETE' })
    showAlert('Pengguna berhasil dihapus', 'success')
    showDeleteConfirm.value = false
    userToDelete.value = null
    await fetchUsers()
  } catch (err) {
    showAlert(err.data?.statusMessage || 'Gagal menghapus', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
      <div>
        <h1 class="text-3xl font-serif text-soft-black">Manajemen Pengguna</h1>
        <p class="text-xs text-muted uppercase tracking-widest mt-1">Kelola administrator sistem dan pelanggan</p>
      </div>
      <button @click="openAddModal" class="btn-luxury flex items-center gap-2">
        <Plus :size="16" /> Tambah Pengguna Baru
      </button>
    </div>

    <div class="mb-8 flex gap-4">
      <div class="flex-1 relative">
        <input 
          v-model="search"
          type="text" 
          placeholder="Cari berdasarkan nama atau email..." 
          class="w-full bg-white border border-border px-10 py-3 text-sm outline-none focus:border-soft-black transition-colors"
        />
        <Search :size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-border overflow-hidden shadow-sm" v-motion-fade>
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-neutral-50 border-b border-border">
            <th class="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">Pengguna</th>
            <th class="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">Peran</th>
            <th class="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">Status</th>
            <th class="px-6 py-4 text-[10px] uppercase tracking-widest font-bold">WardanaPay</th>
            <th class="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-neutral-50/50 transition-colors group">
            <td class="px-6 py-4">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full border border-border overflow-hidden bg-neutral-100 flex items-center justify-center shadow-inner">
                  <img v-if="user.profile_image" :src="user.profile_image" class="w-full h-full object-cover" />
                  <UserIcon v-else :size="18" class="text-neutral-400" />
                </div>
                <div>
                  <p class="text-sm font-bold text-soft-black">{{ user.username }}</p>
                  <p class="text-xs text-muted">{{ user.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span 
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold border"
                :class="user.level === 'admin' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-blue-200 bg-blue-50 text-blue-700'"
              >
                <Shield v-if="user.level === 'admin'" :size="10" />
                {{ user.level === 'admin' ? 'Admin' : 'Pengguna' }}
              </span>
            </td>
            <td class="px-6 py-4">
              <span 
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold rounded-full"
                :class="user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >
                <CheckCircle v-if="user.status === 'active'" :size="10" />
                <AlertCircle v-else :size="10" />
                {{ user.status === 'active' ? 'Aktif' : 'Ditangguhkan' }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div v-if="user.wallet" class="flex flex-col">
                <span class="text-[11px] font-bold text-soft-black">Rp{{ user.wallet.balance.toLocaleString('id-ID') }}</span>
                <span class="text-[9px] text-muted uppercase tracking-widest font-mono">WP-{{ user.id.toString().padStart(6, '0') }}</span>
              </div>
              <span v-else class="text-[10px] text-neutral-300 italic uppercase tracking-widest">Belum Aktif</span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button @click="openWalletModal(user)" class="p-2 hover:bg-neutral-100 text-soft-black transition-colors" title="Kelola Dompet">
                  <Wallet :size="16" />
                </button>
                <button @click="openEditModal(user)" class="p-2 hover:bg-neutral-100 text-soft-black transition-colors" title="Ubah">
                  <Edit :size="16" />
                </button>
                <button @click="openConfirmDelete(user)" class="p-2 hover:bg-red-50 text-red-600 transition-colors" title="Hapus">
                  <Trash2 :size="16" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="4" class="px-6 py-20 text-center text-muted italic text-sm">
              <Users :size="48" class="mx-auto text-neutral-200 mb-4" />
              Tidak ada pengguna yang cocok dengan pencarian Anda.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showModal" class="fixed inset-0 z-[60] flex items-center justify-center p-6">
        <div class="absolute inset-0 bg-soft-black/40 backdrop-blur-sm" @click="showModal = false"></div>
        
        <div class="relative bg-white w-full max-w-lg shadow-2xl border border-border">
          <div class="p-6 border-b border-border flex items-center justify-between">
            <h3 class="text-xl font-serif">{{ isEditing ? 'Ubah Pengguna' : 'Tambah Pengguna Baru' }}</h3>
            <button @click="showModal = false" class="text-muted hover:text-soft-black">
              <X :size="20" />
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="p-8 space-y-6">
            <div class="grid grid-cols-1 gap-6">
              <div>
                <label class="block text-[10px] uppercase tracking-widest font-bold mb-2">Username</label>
                <input v-model="form.username" required class="w-full border border-border px-4 py-3 text-sm focus:outline-none focus:border-soft-black" />
              </div>
              
              <div>
                <label class="block text-[10px] uppercase tracking-widest font-bold mb-2">Alamat Email</label>
                <input v-model="form.email" type="email" required class="w-full border border-border px-4 py-3 text-sm focus:outline-none focus:border-soft-black" />
              </div>

              <div v-if="!isEditing">
                <label class="block text-[10px] uppercase tracking-widest font-bold mb-2">Kata Sandi</label>
                <input v-model="form.password" type="password" required class="w-full border border-border px-4 py-3 text-sm focus:outline-none focus:border-soft-black" />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] uppercase tracking-widest font-bold mb-2">Peran</label>
                  <select v-model="form.level" class="w-full border border-border px-4 py-3 text-sm focus:outline-none focus:border-soft-black bg-white appearance-none">
                    <option value="user">Pengguna</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] uppercase tracking-widest font-bold mb-2">Status</label>
                  <select v-model="form.status" class="w-full border border-border px-4 py-3 text-sm focus:outline-none focus:border-soft-black bg-white appearance-none">
                    <option value="active">Aktif</option>
                    <option value="suspended">Ditangguhkan</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" :disabled="loading" class="w-full btn-luxury flex items-center justify-center gap-2 py-4">
              <Loader2 v-if="loading" :size="16" class="animate-spin" />
              {{ isEditing ? 'Perbarui Pengguna' : 'Buat Pengguna' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Wallet Management Modal -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showWalletModal" class="fixed inset-0 z-[60] flex items-center justify-center p-6">
        <div class="absolute inset-0 bg-soft-black/40 backdrop-blur-sm" @click="showWalletModal = false"></div>
        
        <div class="relative bg-white w-full max-w-md shadow-2xl border border-border">
          <div class="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 class="text-xl font-serif">Kelola WardanaPay</h3>
              <p class="text-[10px] uppercase tracking-widest text-muted mt-1">{{ selectedUserForWallet?.username }}</p>
            </div>
            <button @click="showWalletModal = false" class="text-muted hover:text-soft-black">
              <X :size="20" />
            </button>
          </div>

          <form @submit.prevent="handleUpdateWallet" class="p-8 space-y-6">
            <div class="space-y-6">
              <div class="p-4 bg-neutral-50 border border-border">
                <p class="text-[9px] uppercase tracking-[0.2em] font-bold text-muted mb-3">Saldo Saat Ini</p>
                <p class="text-2xl font-serif text-soft-black">Rp{{ (selectedUserForWallet?.wallet?.balance || 0).toLocaleString('id-ID') }}</p>
              </div>

              <div class="grid grid-cols-1 gap-6 pt-2">
                <div>
                  <label class="block text-[10px] uppercase tracking-widest font-bold mb-2">Tambah Saldo (Top Up)</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold">Rp</span>
                    <input 
                      v-model="walletForm.topupAmount" 
                      type="number" 
                      class="w-full border border-border pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-soft-black bg-white" 
                      placeholder="0"
                    />
                  </div>
                  <div class="flex gap-2 mt-3">
                    <button 
                      v-for="amt in [10000, 50000, 100000]" 
                      :key="amt"
                      type="button"
                      @click="walletForm.topupAmount = amt"
                      class="px-3 py-1.5 border border-border text-[9px] font-bold uppercase tracking-widest hover:border-soft-black transition-colors"
                    >
                      +{{ (amt/1000) }}k
                    </button>
                  </div>
                </div>

                <div class="relative py-4">
                  <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-border"></div></div>
                  <div class="relative flex justify-center text-[8px] uppercase tracking-[0.3em] font-bold text-neutral-300"><span class="bg-white px-2">Atau Atur Manual</span></div>
                </div>

                <div>
                  <label class="block text-[10px] uppercase tracking-widest font-bold mb-2 text-muted">Total Saldo Akhir</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">Rp</span>
                    <input 
                      v-model="walletForm.balance" 
                      type="number" 
                      required 
                      class="w-full border border-border pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-soft-black bg-neutral-50 text-muted" 
                    />
                  </div>
                </div>
                
                <div>
                  <label class="block text-[10px] uppercase tracking-widest font-bold mb-2">Reset PIN Keamanan</label>
                  <input 
                    v-model="walletForm.pin" 
                    type="text" 
                    maxlength="6" 
                    placeholder="Masukkan 6 digit angka untuk reset"
                    class="w-full border border-border px-4 py-3 text-sm focus:outline-none focus:border-soft-black font-mono tracking-widest" 
                  />
                </div>
              </div>
            </div>

            <button type="submit" :disabled="loading" class="w-full btn-luxury flex items-center justify-center gap-2 py-4">
              <Loader2 v-if="loading" :size="16" class="animate-spin" />
              Simpan Perubahan Saldo
            </button>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-[70] flex items-center justify-center p-6">
      <div class="absolute inset-0 bg-soft-black/40 backdrop-blur-sm" @click="showDeleteConfirm = false"></div>
      <div class="bg-white w-full max-w-sm relative z-10 p-8 border border-border shadow-2xl text-center" v-motion-pop>
        <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle :size="32" />
        </div>
        <h3 class="text-xl font-serif mb-2 text-soft-black">Konfirmasi Penghapusan</h3>
        <p class="text-sm text-muted font-sans leading-relaxed mb-8">
          Apakah Anda yakin ingin menghapus pengguna <span class="font-bold text-soft-black">"{{ userToDelete?.username }}"</span>? Tindakan ini tidak dapat dibatalkan.
        </p>
        
        <div class="grid grid-cols-2 gap-4">
          <button 
            @click="showDeleteConfirm = false" 
            class="px-6 py-3 border border-border text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-50 transition-colors"
          >
            Batal
          </button>
          <button 
            @click="handleDeleteUser" 
            :disabled="loading"
            class="px-6 py-3 bg-red-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Loader2 v-if="loading" :size="14" class="animate-spin" />
            Hapus
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
