<script setup lang="ts">
import {sendShutdownCommand, getDevicesViaSocket, setupDeviceListeners, cleanupDeviceListeners, isSocketConnected, authenticateSocket} from './socket';
import {onBeforeUnmount, onMounted, ref, nextTick} from 'vue';
import {getSession, authClient} from '~~/lib/auth-client';
import type { HardwareInfo } from '~~/db/deviceSchema';

interface Device {
  id: string;
  name: string;
  ipAddress: string;
  macAddress: string;
  isConnected: boolean;
  lastSeen: Date | null;
  hardware?: HardwareInfo;
  userId?: string;
  userName?: string;
  userEmail?: string;
}

const devices = ref<Device[]>([]);
const loading = ref(true);
const error = ref('');
const shuttingDown = ref<string[]>([]);
const isAdmin = ref(false);
const currentUser = ref<any>(null);
const selectedUserFilter = ref('all');

// Cache for faster lookups
const deviceMap = ref(new Map<string, number>());

// Update device map for faster lookups
const updateDeviceMap = () => {
  deviceMap.value.clear();
  devices.value.forEach((device, index) => {
    deviceMap.value.set(device.macAddress, index);
  });
};

// Check if current user is admin
const checkAdminRole = async () => {
  try {
    const userSession = await getSession();
    currentUser.value = userSession.data?.user;
    
    if (!currentUser.value) {
      isAdmin.value = false;
      return;
    }

    // Check if user has admin role
    const userRole = currentUser.value?.role;
    isAdmin.value = !!(userRole && (userRole === 'admin' || (Array.isArray(userRole) && userRole.includes('admin'))));
  } catch (error) {
    console.error('Error checking admin role:', error);
    isAdmin.value = false;
  }
};

// Get unique users from devices for filter
const uniqueUsers = computed(() => {
  if (!isAdmin.value) return [];
  
  const users = new Map();
  devices.value.forEach((device) => {
    if (device.userId && device.userName) {
      users.set(device.userId, {
        id: device.userId,
        name: device.userName,
        email: device.userEmail
      });
    }
  });
  
  return Array.from(users.values());
});

// Filter devices based on selected user (admin only)
const filteredDevices = computed(() => {
  if (!isAdmin.value || selectedUserFilter.value === 'all') {
    return devices.value;
  }
  
  return devices.value.filter(device => device.userId === selectedUserFilter.value);
});

// Compute grid layout for bento design
const getDeviceGridClass = (index: number) => {
  const patterns = [
    'col-span-1 row-span-2', // Tall card
    'col-span-2 row-span-1', // Wide card
    'col-span-1 row-span-1', // Regular card
    'col-span-1 row-span-1', // Regular card
    'col-span-2 row-span-2', // Large card
    'col-span-1 row-span-1', // Regular card
  ];
  return patterns[index % patterns.length];
};

// Get device status color
const getStatusColor = (isConnected: boolean) => {
  return isConnected ? 'success' : 'error';
};

// Get device icon based on hardware
const getDeviceIcon = (device: Device) => {
  if (!device.hardware?.os?.name) return 'i-heroicons-computer-desktop';
  
  const osName = device.hardware.os.name.toLowerCase();
  if (osName.includes('windows')) return 'i-simple-icons-windows';
  if (osName.includes('macos') || osName.includes('darwin')) return 'i-simple-icons-apple';
  if (osName.includes('ubuntu')) return 'i-simple-icons-ubuntu';
  if (osName.includes('linux')) return 'i-simple-icons-linux';
  return 'i-heroicons-computer-desktop';
};

// Get performance score based on hardware usage
const getPerformanceScore = (hardware?: HardwareInfo) => {
  if (!hardware) return null;
  
  const metrics = [];
  if (hardware.cpu?.usage !== undefined) metrics.push(100 - hardware.cpu.usage);
  if (hardware.memory?.used && hardware.memory?.total) {
    const memoryUsage = (hardware.memory.used / hardware.memory.total) * 100;
    metrics.push(100 - memoryUsage);
  }
  if (hardware.storage?.used && hardware.storage?.total) {
    const storageUsage = (hardware.storage.used / hardware.storage.total) * 100;
    metrics.push(100 - storageUsage);
  }
  
  if (metrics.length === 0) return null;
  
  const avgScore = metrics.reduce((a, b) => a + b, 0) / metrics.length;
  return Math.round(avgScore);
};

// Get performance color
const getPerformanceColor = (score?: number) => {
  if (!score) return 'neutral';
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
};

// Optimized device update function
const updateDeviceInList = async (updatedDevice: Device) => {
  await nextTick();
  
  const index = deviceMap.value.get(updatedDevice.macAddress);
  
  if (index !== undefined) {
    // Update existing device
    const currentDevice = devices.value[index];
    const wasDisconnected = !currentDevice?.isConnected;
    
    devices.value[index] = {
      ...currentDevice,
      ...updatedDevice,
      lastSeen: updatedDevice.lastSeen ? (updatedDevice.lastSeen instanceof Date ? updatedDevice.lastSeen : new Date(updatedDevice.lastSeen)) : null
    };

    if (wasDisconnected && updatedDevice.isConnected) {
      toast.add({
        title: 'Device Reconnected',
        description: `${updatedDevice.name} has reconnected`,
        color: 'success'
      });
    }
  } else {
    // Add new device
    devices.value.push({
      ...updatedDevice,
      lastSeen: updatedDevice.lastSeen ? (updatedDevice.lastSeen instanceof Date ? updatedDevice.lastSeen : new Date(updatedDevice.lastSeen)) : null
    });
    
    updateDeviceMap();
    
    toast.add({
      title: 'New Device',
      description: `${updatedDevice.name} has connected`,
      color: 'success'
    });
  }
};

// Handle device disconnect
const handleDeviceDisconnect = async (macAddress: string) => {
  await nextTick();
  
  const index = deviceMap.value.get(macAddress);
  if (index !== undefined) {
    const device = devices.value[index];
    if (device) {
      device.isConnected = false;
      
      toast.add({
        title: 'Device Disconnected',
        description: `${device.name} has disconnected`,
        color: 'warning'
      });
    }
  }
};

// Handle device shutdown
const handleDeviceShutdown = async (macAddress: string) => {
  await nextTick();
  
  const index = deviceMap.value.get(macAddress);
  if (index !== undefined) {
    const device = devices.value[index];
    if (device) {
      device.isConnected = false;
      
      toast.add({
        title: 'Device Shutdown',
        description: `${device.name} has shut down`,
        color: 'info'
      });
    }
  }
};

// Fetch devices via HTTP API (more reliable than Socket.IO for manual refresh)
const fetchDevicesViaHTTP = async () => {
  try {
    console.log('📋 [HTTP] Fetching devices...');
    
    const response = await $fetch('/api/devices', {
      method: 'GET'
    });

    if (!response.success) {
      throw new Error('Failed to fetch devices');
    }

    console.log(`📋 [HTTP] Received ${response.devices.length} devices`);
    return response.devices;
  } catch (err: any) {
    console.error('❌ [HTTP] Error fetching devices:', err);
    throw err;
  }
};

// Fetch devices via Socket.IO (fallback)
const fetchDevicesViaSocket = async () => {
  try {
    console.log('📋 [Socket.IO] Fetching devices...');
    
    // Get current user ID from session
    const userSession = await getSession();
    const userId = userSession.data?.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const data = await getDevicesViaSocket(userId, isAdmin.value);
    console.log(`📋 [Socket.IO] Received ${data.length} devices`);
    return data;
  } catch (err: any) {
    console.error('❌ [Socket.IO] Error fetching devices:', err);
    throw err;
  }
};

// Main fetch function with HTTP first, Socket.IO fallback
const fetchDevices = async () => {
  try {
    loading.value = true;
    error.value = '';

    let data;
    
    try {
      // Try HTTP API first (more reliable)
      data = await fetchDevicesViaHTTP();
      console.log('✅ Using HTTP API for device fetch');
    } catch (httpError) {
      console.warn('⚠️ HTTP API failed, falling back to Socket.IO:', httpError);
      
      // Fallback to Socket.IO if HTTP fails
      if (!isSocketConnected()) {
        throw new Error('Both HTTP API and Socket.IO are unavailable');
      }
      
      data = await fetchDevicesViaSocket();
      console.log('✅ Using Socket.IO fallback for device fetch');
    }

    // Process devices data
    const processedData = data.map((device: any) => ({
      ...device,
      lastSeen: device.lastSeen ? new Date(device.lastSeen) : null
    }));

    // Update devices and map
    devices.value = processedData;
    updateDeviceMap();

    // Log statistics
    const connectedDevices = processedData.filter((d: Device) => d.isConnected);
    console.log(`📊 ${connectedDevices.length}/${processedData.length} devices online`);

    return processedData;
  } catch (err: any) {
    console.error('❌ Error fetching devices:', err);
    error.value = err.message || 'Unable to load device list';
    return [];
  } finally {
    loading.value = false;
  }
};

// Shutdown device via HTTP API
const shutdownDeviceViaHTTP = async (macAddress: string) => {
  try {
    console.log(`🔌 [HTTP] Attempting shutdown: ${macAddress}`);
    
    const response = await $fetch('/api/devices/shutdown', {
      method: 'POST',
      body: { macAddress }
    });

    if (!response.success) {
      throw new Error(response.message || 'Shutdown failed');
    }

    console.log(`✅ [HTTP] Shutdown successful: ${macAddress}`);
    return response;
  } catch (err: any) {
    console.error(`❌ [HTTP] Shutdown failed: ${macAddress}`, err);
    throw err;
  }
};

// Shutdown device via Socket.IO (fallback)
const shutdownDeviceViaSocket = async (macAddress: string) => {
  try {
    console.log(`🔌 [Socket.IO] Attempting shutdown: ${macAddress}`);
    
    // Get current user ID from session
    const userSession = await getSession();
    const userId = userSession.data?.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const result = await sendShutdownCommand(userId, macAddress, isAdmin.value);
    
    if (!result.success) {
      throw new Error(result.message);
    }

    console.log(`✅ [Socket.IO] Shutdown successful: ${macAddress}`);
    return result;
  } catch (err: any) {
    console.error(`❌ [Socket.IO] Shutdown failed: ${macAddress}`, err);
    throw err;
  }
};

// Handle device shutdown command with HTTP first, Socket.IO fallback
const handleShutdown = async (macAddress: string) => {
  if (shuttingDown.value.includes(macAddress)) return;

  const device = devices.value.find(d => d.macAddress === macAddress);
  if (!device) {
    toast.add({
      title: 'Error',
      description: 'Device not found',
      color: 'error'
    });
    return;
  }

  console.log(`🔌 Attempting to shutdown device: ${device.name} (${macAddress})`);
  shuttingDown.value.push(macAddress);
  
  try {
    let result;
    
    try {
      // Try HTTP API first (more reliable)
      result = await shutdownDeviceViaHTTP(macAddress);
      console.log('✅ Using HTTP API for shutdown');
    } catch (httpError) {
      console.warn('⚠️ HTTP shutdown failed, falling back to Socket.IO:', httpError);
      
      // Fallback to Socket.IO if HTTP fails
      if (!isSocketConnected()) {
        throw new Error('Both HTTP API and Socket.IO are unavailable');
      }
      
      result = await shutdownDeviceViaSocket(macAddress);
      console.log('✅ Using Socket.IO fallback for shutdown');
    }

    // Update UI immediately
    await handleDeviceShutdown(macAddress);

    toast.add({
      title: 'Success',
      description: `Shutdown command sent to ${device.name}`,
      color: 'success'
    });
  } catch (err: any) {
    console.error('❌ Error shutting down device:', err);
    
    toast.add({
      title: 'Error',
      description: err.message || 'Failed to shutdown device',
      color: 'error'
    });
  } finally {
    shuttingDown.value = shuttingDown.value.filter(id => id !== macAddress);
  }
};

// Generate unique component ID based on current route and admin status
const componentId = computed(() => {
  const route = useRoute();
  return `device-list-${route.path}-${isAdmin.value ? 'admin' : 'user'}`;
});

// Setup Socket.IO listeners
const setupSocketListeners = () => {
  setupDeviceListeners(componentId.value, {
    onDeviceUpdate: (updatedDevice: Device) => {
      updateDeviceInList(updatedDevice);
    },

    onDeviceDisconnect: (macAddress: string) => {
      handleDeviceDisconnect(macAddress);
    },

    onDeviceShutdown: (macAddress: string) => {
      handleDeviceShutdown(macAddress);
    },

    onReconnect: () => {
      fetchDevices();
    }
  });
};



const toast = useToast();

// Refs for cleanup
const refreshInterval = ref<NodeJS.Timeout | null>(null);

// Initialize component
onMounted(async () => {
  // Check admin role first and wait for completion
  await checkAdminRole();

  // Setup Socket.IO listeners first
  setupSocketListeners();

  // Wait for socket connection before fetching data
  const waitForSocket = () => {
    return new Promise<void>((resolve) => {
      const checkConnection = () => {
        if (isSocketConnected()) {
          resolve();
        } else {
          setTimeout(checkConnection, 100); // Check every 100ms
        }
      };
      checkConnection();
    });
  };

  // Wait for socket then authenticate and fetch devices
  await waitForSocket();
  
  // Authenticate socket with user info
  if (currentUser.value) {
    try {
      await authenticateSocket(currentUser.value.id, currentUser.value.role);
    } catch (error) {
      console.error('Failed to authenticate socket:', error);
    }
  }
  
  await fetchDevices();

  // Auto-refresh every 3 minutes as backup
  refreshInterval.value = setInterval(() => {
    if (isSocketConnected()) {
      fetchDevices();
    }
  }, 3 * 60 * 1000);
});

// Cleanup on unmount
onBeforeUnmount(() => {
  // Clear refresh interval
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
  
  // Clean up socket listeners
  cleanupDeviceListeners(componentId.value);
});

// Utility functions
const formatDate = (date?: Date) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

const getTimeAgo = (date?: Date) => {
  if (!date) return 'N/A';
  
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

// Simple refresh handler
const handleRefresh = async () => {
  await fetchDevices();
};


</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Header with stats and refresh -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Device Management
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">Monitor and control your connected devices</p>
      </div>
      
      <div class="flex items-center gap-4">
        <!-- Admin badge -->
        <UBadge v-if="isAdmin" color="primary" size="sm" class="flex items-center gap-1">
          <UIcon name="i-heroicons-shield-check" class="h-3 w-3" />
          Admin View
        </UBadge>
        
        <!-- User filter for admin -->
        <USelect
          v-if="isAdmin && uniqueUsers.length > 0"
          v-model="selectedUserFilter"
          :options="[
            { label: 'All Users', value: 'all' },
            ...uniqueUsers.map(user => ({ 
              label: user.name || user.email, 
              value: user.id 
            }))
          ]"
          placeholder="Filter by user"
          size="sm"
          class="w-48"
        />
        
        <!-- Stats -->
        <div v-if="!loading && filteredDevices.length > 0" class="flex items-center gap-4 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span>{{ filteredDevices.filter(d => d.isConnected).length }} online</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>{{ filteredDevices.filter(d => !d.isConnected).length }} offline</span>
          </div>
          <div v-if="isAdmin" class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>{{ uniqueUsers.length }} users</span>
          </div>
        </div>
        

        
        <!-- Refresh button -->
        <UButton
          variant="outline"
          icon="i-heroicons-arrow-path"
          :loading="loading"
          @click="handleRefresh"
          size="sm"
        >
          Refresh
        </UButton>
      </div>
    </div>

    <!-- Error message -->
    <UAlert
      v-if="error"
      color="error"
      title="Error"
      :description="error"
      class="mb-6"
      icon="i-heroicons-exclamation-triangle"
    />

    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <div class="relative">
        <div class="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <UIcon name="i-heroicons-computer-desktop" class="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
      </div>
      <p class="mt-4 text-gray-600 dark:text-gray-400">Loading your devices...</p>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && (!filteredDevices || filteredDevices.length === 0)" class="text-center py-20">
      <div class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
        <UIcon name="i-heroicons-computer-desktop" class="h-12 w-12 text-blue-600" />
      </div>
      <h3 class="text-2xl font-semibold mb-3">
        {{ isAdmin && selectedUserFilter !== 'all' ? 'No devices for selected user' : 'No devices found' }}
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {{ isAdmin && selectedUserFilter !== 'all' 
          ? 'The selected user has no connected devices.' 
          : 'Connect your first device to start monitoring and managing your network.' 
        }}
      </p>
      <UButton
        variant="outline"
        icon="i-heroicons-arrow-path"
        @click="handleRefresh"
        size="lg"
      >
        Refresh devices
      </UButton>
    </div>

    <!-- Bento Grid Layout -->
    <div v-if="!loading && filteredDevices && filteredDevices.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        v-for="(device, index) in filteredDevices"
        :key="device.macAddress"
        class="col-span-1 row-span-2 group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
      >
        <!-- Status indicator -->
        <div class="absolute top-4 right-4 z-10">
          <div class="flex items-center gap-2">
            <UBadge
              :color="getStatusColor(device.isConnected)"
              size="sm"
              class="backdrop-blur-sm"
            >
              <div class="flex items-center gap-1">
                <div 
                  class="w-2 h-2 rounded-full"
                  :class="device.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
                ></div>
                {{ device.isConnected ? 'Online' : 'Offline' }}
              </div>
            </UBadge>
          </div>
        </div>

        <!-- Background pattern -->
        <div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10"></div>
        
        <!-- Device card content -->
        <div class="relative p-6 h-full flex flex-col">
          <!-- Header -->
          <div class="flex items-start gap-4 mb-4">
            <div class="p-3 leading-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
              <UIcon :name="getDeviceIcon(device)" class="h-6 w-6" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                {{ device.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ device.ipAddress }}</p>
              <!-- User owner info for admin -->
              <div v-if="isAdmin && device.userName" class="flex items-center gap-1 mt-1">
                <UIcon name="i-heroicons-user" class="h-3 w-3 text-blue-500" />
                <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {{ device.userName }}
                </span>
              </div>
            </div>
          </div>

          <!-- Hardware info -->
          <div class="flex-1">
            <HardwareInfo 
              :hardware="device.hardware" 
              :variant="(device.hardware) ? 'default' : 'compact'"
            />
          </div>

          <!-- Device details -->
          <div class="mt-4 space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">MAC Address</span>
              <span class="font-mono text-xs">{{ device.macAddress }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">Last seen</span>
              <span>{{ getTimeAgo(device.lastSeen || undefined) }}</span>
            </div>
          </div>

          <!-- Action button -->
          <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <UButton
              :icon="device.isConnected ? 'i-heroicons-power' : 'i-heroicons-arrow-path'"
              :color="device.isConnected ? 'error' : 'neutral'"
              :variant="device.isConnected ? 'soft' : 'outline'"
              class="w-full"
              size="sm"
              :loading="shuttingDown.includes(device.macAddress)"
              :disabled="!device.isConnected || shuttingDown.includes(device.macAddress)"
              @click="handleShutdown(device.macAddress)"
            >
              {{ device.isConnected ? 'Shutdown Device' : 'Device Offline' }}
            </UButton>
          </div>
        </div>

        <!-- Hover overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
    </div>
    

  </div>
</template>

<style scoped>
.auto-rows-fr {
  grid-auto-rows: minmax(320px, auto);
}
</style>





