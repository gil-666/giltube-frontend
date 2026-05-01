<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-white mb-2">🔧 Admin Panel</h1>
      <p class="text-gray-400">Platform management and statistics</p>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm mb-1">Total Users</p>
        <p class="text-3xl font-bold text-blue-400">{{ stats.total_users }}</p>
      </div>
      <div class="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm mb-1">Total Channels</p>
        <p class="text-3xl font-bold text-green-400">{{ stats.total_channels }}</p>
      </div>
      <div class="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm mb-1">Total Videos</p>
        <p class="text-3xl font-bold text-purple-400">{{ stats.total_videos }}</p>
      </div>
      <div class="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <p class="text-gray-400 text-sm mb-1">Platform Views</p>
        <p class="text-3xl font-bold text-yellow-400">{{ formatNumber(stats.total_views) }}</p>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex gap-4 border-b border-zinc-700">
      <button
        @click="activeTab = 'users'"
        :class="['px-4 py-2 border-b-2 font-semibold transition', activeTab === 'users' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        👥 Users
      </button>
      <button
        @click="activeTab = 'channels'"
        :class="['px-4 py-2 border-b-2 font-semibold transition', activeTab === 'channels' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        📺 Channels
      </button>
      <button
        @click="activeTab = 'videos'"
        :class="['px-4 py-2 border-b-2 font-semibold transition', activeTab === 'videos' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white']"
      >
        🎬 Videos
      </button>
    </div>

    <!-- Users Tab -->
    <div v-if="activeTab === 'users'" class="space-y-4">
      <h2 class="text-2xl font-bold text-white mb-4">User Management</h2>
      
      <!-- Search/Filter -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search users by name or email..."
        class="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />

      <!-- Users Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-zinc-900 border-b border-zinc-700">
            <tr>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Username</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Email</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Type</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Status</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Channels</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Videos</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Total Views</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-700">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-zinc-800 transition">
              <td class="px-4 py-3 text-white">{{ user.username }}</td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ user.email }}</td>
              <td class="px-4 py-3">
                <span :class="['px-2 py-1 rounded text-xs font-semibold', user.user_type === 'admin' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200']">
                  {{ user.user_type }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span :class="['px-2 py-1 rounded text-xs font-semibold', user.status === 'active' ? 'bg-green-900 text-green-200' : user.status === 'suspended' ? 'bg-yellow-900 text-yellow-200' : 'bg-red-900 text-red-200']">
                  {{ user.status || 'active' }}
                </span>
              </td>
              <td class="px-4 py-3 text-white">{{ user.channel_count }}</td>
              <td class="px-4 py-3 text-white">{{ user.video_count }}</td>
              <td class="px-4 py-3 text-white">{{ formatNumber(user.total_views) }}</td>
              <td class="px-4 py-3 space-x-1 flex flex-wrap">
                <button
                  @click="toggleUserAdmin(user.id, user.user_type)"
                  :class="['px-2 py-1 rounded text-xs transition', user.user_type === 'admin' ? 'bg-yellow-900 hover:bg-yellow-800 text-yellow-200' : 'bg-purple-900 hover:bg-purple-800 text-purple-200']"
                >
                  {{ user.user_type === 'admin' ? '⬇️ Demote' : '⬆️ Promote' }}
                </button>
                <button
                  v-if="user.status !== 'suspended'"
                  @click="suspendUser(user.id, user.username)"
                  class="px-2 py-1 bg-yellow-900 hover:bg-yellow-800 text-yellow-200 rounded text-xs transition"
                >
                  ⏸️ Suspend
                </button>
                <button
                  v-if="user.status === 'suspended'"
                  @click="unsuspendUser(user.id, user.username)"
                  class="px-2 py-1 bg-green-900 hover:bg-green-800 text-green-200 rounded text-xs transition"
                >
                  ✅ Unsuspend
                </button>
                <button
                  v-if="user.status !== 'banned'"
                  @click="banUser(user.id, user.username)"
                  class="px-2 py-1 bg-red-900 hover:bg-red-800 text-red-200 rounded text-xs transition"
                >
                  🚫 Ban
                </button>
                <button
                  v-if="user.status === 'banned'"
                  @click="unbanUser(user.id, user.username)"
                  class="px-2 py-1 bg-green-900 hover:bg-green-800 text-green-200 rounded text-xs transition"
                >
                  ✅ Unban
                </button>
                <button
                  @click="deleteUser(user.id, user.username)"
                  class="px-2 py-1 bg-gray-900 hover:bg-gray-800 text-gray-200 rounded text-xs transition"
                >
                  🗑️ Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Channels Tab -->
    <div v-if="activeTab === 'channels'" class="space-y-4">
      <h2 class="text-2xl font-bold text-white mb-4">Channel Management</h2>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-zinc-900 border-b border-zinc-700">
            <tr>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Channel Name</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Owner</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Status</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Videos</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Total Views</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Created</th>
              <th class="px-4 py-3 text-left text-gray-400 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-700">
            <tr v-for="channel in channels" :key="channel.id" class="hover:bg-zinc-800 transition">
              <td class="px-4 py-3 text-white font-semibold">{{ channel.name }}</td>
              <td class="px-4 py-3 text-gray-400">{{ channel.username }}</td>
              <td class="px-4 py-3">
                <span :class="['px-2 py-1 rounded text-xs font-semibold', channel.status === 'active' ? 'bg-green-900 text-green-200' : channel.status === 'suspended' ? 'bg-yellow-900 text-yellow-200' : 'bg-red-900 text-red-200']">
                  {{ channel.status || 'active' }}
                </span>
              </td>
              <td class="px-4 py-3 text-white">{{ channel.video_count }}</td>
              <td class="px-4 py-3 text-white">{{ formatNumber(channel.total_views) }}</td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ new Date(channel.created_at).toLocaleDateString() }}</td>
              <td class="px-4 py-3 space-x-1 flex flex-wrap">
                <button
                  v-if="channel.status !== 'suspended'"
                  @click="suspendChannel(channel.id, channel.name)"
                  class="px-2 py-1 bg-yellow-900 hover:bg-yellow-800 text-yellow-200 rounded text-xs transition"
                >
                  ⏸️ Suspend
                </button>
                <button
                  v-if="channel.status === 'suspended'"
                  @click="unsuspendChannel(channel.id, channel.name)"
                  class="px-2 py-1 bg-green-900 hover:bg-green-800 text-green-200 rounded text-xs transition"
                >
                  ✅ Unsuspend
                </button>
                <button
                  v-if="channel.status !== 'banned'"
                  @click="banChannel(channel.id, channel.name)"
                  class="px-2 py-1 bg-red-900 hover:bg-red-800 text-red-200 rounded text-xs transition"
                >
                  🚫 Ban
                </button>
                <button
                  v-if="channel.status === 'banned'"
                  @click="unbanChannel(channel.id, channel.name)"
                  class="px-2 py-1 bg-green-900 hover:bg-green-800 text-green-200 rounded text-xs transition"
                >
                  ✅ Unban
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Videos Tab -->
    <div v-if="activeTab === 'videos'" class="space-y-4">
      <h2 class="text-2xl font-bold text-white mb-4">Video Statistics</h2>
      <p class="text-gray-400">Total Videos: <span class="text-white font-bold">{{ stats.total_videos }}</span></p>
      <p class="text-gray-400">Total Comments: <span class="text-white font-bold">{{ stats.total_comments }}</span></p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center text-gray-400 py-8">
      Loading admin data...
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalePath } from '#i18n'

const router = useRouter()
const localePath = useLocalePath()
const activeTab = ref('users')
const searchQuery = ref('')
const loading = ref(true)
const error = ref('')

const stats = ref({
  total_users: 0,
  total_channels: 0,
  total_videos: 0,
  total_views: 0,
  total_comments: 0,
  admin_count: 0,
  total_categories: 0
})

const users = ref<any[]>([])
const channels = ref<any[]>([])

// Get user_id from localStorage
const userId = typeof localStorage !== 'undefined' ? localStorage.getItem('user_id') : null

// Check if user is admin by fetching from backend
// Backend will return 401/403 if not authenticated or not admin
onMounted(async () => {
  if (!userId) {
    error.value = 'Not authenticated'
    setTimeout(() => router.push(localePath('/login')), 2000)
    return
  }

  // Verify admin status by trying to fetch admin stats
  // Backend will enforce authentication and admin check
  try {
    const statsRes = await fetch(`/api/v1/admin/stats?user_id=${userId}`, {
      headers: {
        'X-User-ID': userId
      }
    })
    
    // If 401/403, user is not admin
    if (statsRes.status === 401 || statsRes.status === 403) {
      error.value = 'Access denied. Admin privileges required.'
      setTimeout(() => router.push(localePath('/')), 2000)
      return
    }
    
    if (!statsRes.ok) {
      throw new Error(`HTTP ${statsRes.status}`)
    }
  } catch (err) {
    console.error('Failed to verify admin status:', err)
    error.value = 'Failed to verify admin status'
    setTimeout(() => router.push(localePath('/')), 2000)
    return
  }

  await loadAdminData()
})

const loadAdminData = async () => {
  if (!userId) return
  
  try {
    loading.value = true
    
    // Fetch stats
    const statsRes = await fetch(`/api/v1/admin/stats?user_id=${userId}`, {
      headers: {
        'X-User-ID': userId
      }
    })
    if (statsRes.ok) {
      stats.value = await statsRes.json()
    }

    // Fetch users
    const usersRes = await fetch(`/api/v1/admin/users?user_id=${userId}`, {
      headers: {
        'X-User-ID': userId
      }
    })
    if (usersRes.ok) {
      users.value = await usersRes.json() || []
    }

    // Fetch channels
    const channelsRes = await fetch(`/api/v1/admin/channels?user_id=${userId}`, {
      headers: {
        'X-User-ID': userId
      }
    })
    if (channelsRes.ok) {
      channels.value = await channelsRes.json() || []
    }
  } catch (err) {
    console.error('Failed to load admin data:', err)
    error.value = 'Failed to load admin data'
  } finally {
    loading.value = false
  }
}

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(u => 
    u.username.toLowerCase().includes(query) || 
    u.email.toLowerCase().includes(query)
  )
})

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const toggleUserAdmin = async (userIdToAffect: string, currentType: string) => {
  if (!confirm(`Are you sure you want to ${currentType === 'admin' ? 'demote' : 'promote'} this user?`)) return

  try {
    const res = await fetch(`/api/v1/admin/users/${userIdToAffect}/toggle-admin?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId,
        'Content-Type': 'application/json'
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('User status updated')
    } else {
      error.value = 'Failed to update user status'
    }
  } catch (err) {
    console.error('Error toggling admin:', err)
    error.value = 'Failed to toggle admin status'
  }
}

const unbanChannel = async (channelId: string, channelName: string) => {
  try {
    const res = await fetch(`/api/v1/admin/channels/${channelId}/unban?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert(`Channel "${channelName}" unbanned`)
    } else {
      error.value = 'Failed to unban channel'
    }
  } catch (err) {
    console.error('Error unbanning channel:', err)
    error.value = 'Failed to unban channel'
  }
}

const unbanUser = async (userIdToBan: string, username: string) => {
  try {
    const res = await fetch(`/api/v1/admin/users/${userIdToBan}/unban?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert(`User "${username}" unbanned`)
    } else {
      error.value = 'Failed to unban user'
    }
  } catch (err) {
    console.error('Error unbanning user:', err)
    error.value = 'Failed to unban user'
  }
}

const deleteUser = async (userId: string, username: string) => {
  if (!confirm(`Are you sure you want to DELETE user "${username}" and all their data? This cannot be undone.`)) return

  try {
    const res = await fetch(`/api/v1/admin/users/${userId}?user_id=${userId}`, {
      method: 'DELETE',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('User deleted successfully')
    } else {
      error.value = 'Failed to delete user'
    }
  } catch (err) {
    console.error('Error deleting user:', err)
    error.value = 'Failed to delete user'
  }
}

const suspendUser = async (userIdToSuspend: string, username: string) => {
  if (!confirm(`Suspend user "${username}"? They can still login and use the site but cannot upload videos.`)) return

  try {
    const res = await fetch(`/api/v1/admin/users/${userIdToSuspend}/suspend?user_id=${userIdToSuspend}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('User suspended')
    } else {
      error.value = 'Failed to suspend user'
    }
  } catch (err) {
    console.error('Error suspending user:', err)
    error.value = 'Failed to suspend user'
  }
}

const banUser = async (userIdToBan: string, username: string) => {
  if (!confirm(`BAN user "${username}"? They will be unable to login and all their videos will be hidden. This is a serious action.`)) return

  try {
    const res = await fetch(`/api/v1/admin/users/${userIdToBan}/ban?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('User banned')
    } else {
      error.value = 'Failed to ban user'
    }
  } catch (err) {
    console.error('Error banning user:', err)
    error.value = 'Failed to ban user'
  }
}

const unsuspendUser = async (userIdToUnsuspend: string, username: string) => {
  try {
    const res = await fetch(`/api/v1/admin/users/${userIdToUnsuspend}/unsuspend?user_id=${userIdToUnsuspend}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('User status restored to active')
    } else {
      error.value = 'Failed to unsuspend user'
    }
  } catch (err) {
    console.error('Error unsuspending user:', err)
    error.value = 'Failed to unsuspend user'
  }
}

const suspendChannel = async (channelId: string, channelName: string) => {
  if (!confirm(`Suspend channel "${channelName}"? They can still access it but cannot upload videos.`)) return

  try {
    const res = await fetch(`/api/v1/admin/channels/${channelId}/suspend?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('Channel suspended')
    } else {
      error.value = 'Failed to suspend channel'
    }
  } catch (err) {
    console.error('Error suspending channel:', err)
    error.value = 'Failed to suspend channel'
  }
}

const banChannel = async (channelId: string, channelName: string) => {
  if (!confirm(`BAN channel "${channelName}"? All its videos will be hidden and users cannot switch to this channel.`)) return

  try {
    const res = await fetch(`/api/v1/admin/channels/${channelId}/ban?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('Channel banned')
    } else {
      error.value = 'Failed to ban channel'
    }
  } catch (err) {
    console.error('Error banning channel:', err)
    error.value = 'Failed to ban channel'
  }
}

const unsuspendChannel = async (channelId: string, channelName: string) => {
  try {
    const res = await fetch(`/api/v1/admin/channels/${channelId}/unsuspend?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'X-User-ID': userId
      }
    })

    if (res.ok) {
      await loadAdminData()
      alert('Channel status restored to active')
    } else {
      error.value = 'Failed to unsuspend channel'
    }
  } catch (err) {
    console.error('Error unsuspending channel:', err)
    error.value = 'Failed to unsuspend channel'
  }
}
</script>

<style scoped>
</style>
