<script setup lang="ts">
import {socket, sendShutdownCommand} from './socket';
import {onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {getSession} from '~~/lib/auth-client';

interface Device {
  id: string;
  name: string;
  ipAddress: string;
  macAddress: string;
  isConnected: boolean;
  lastSeen: Date;
}

const devices = ref<Device[]>([]);
const loading = ref(true);
const error = ref('');
const shuttingDown = ref<string[]>([]);

// Lấy danh sách thiết bị từ API
const fetchDevices = async () => {
  try {
    loading.value = true;
    error.value = '';

    console.log('Fetching devices from API...');
    const response = await fetch('/api/devices');
    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || `Lỗi: ${response.status}`;
      throw new Error(errorMessage);
    }

    console.log(`Received ${data.length} devices from API`);

    // Process dates and ensure proper formatting
    const processedData = data.map((device: any) => ({
      ...device,
      lastSeen: device.lastSeen ? new Date(device.lastSeen) : null
    }));

    // Update the devices array
    devices.value = processedData;

    // Log connected devices for debugging
    const connectedDevices = processedData.filter((d: any) => d.isConnected);
    console.log(`${connectedDevices.length} devices are currently connected`);

    return processedData;
  } catch (err: any) {
    console.error('Error fetching devices:', err);
    error.value = err.message || 'Unable to load device list';
    return [];
  } finally {
    loading.value = false;
  }
};

// Xử lý tắt máy
const handleShutdown = async (macAddress: string) => {
  if (shuttingDown.value.includes(macAddress)) return;

  shuttingDown.value.push(macAddress);
  try {
    // Get current user ID from session
    const userSession = await getSession();
    const userId = userSession.data?.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // First try using the socket method
    try {
      const result = await sendShutdownCommand(userId, macAddress);

      if (result.success) {
        // Update UI to show device is disconnected
        const device = devices.value.find(d => d.macAddress === macAddress);
        if (device) {
          device.isConnected = false;
        }

        toast.add({
          title: 'Success',
          description: 'Shutdown command sent via socket',
        });
        return;
      }
    } catch (socketErr) {
      console.warn('Socket shutdown failed, falling back to API:', socketErr);
    }

    // Fallback to API method if socket method fails
    const response = await fetch('/api/devices/shutdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ macAddress }),
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.message || `Lỗi: ${response.status}`;
      throw new Error(errorMessage);
    }

    if (result.success) {
      // Update UI to show device is disconnected
      const device = devices.value.find(d => d.macAddress === macAddress);
      if (device) {
        device.isConnected = false;
      }

      toast.add({
        title: 'Success',
        description: 'Shutdown command sent via API',
      });
    }
  } catch (err: any) {
    console.error('Error shutting down device:', err);
    const errorMessage = err.message || 'Đã xảy ra lỗi khi tắt thiết bị';

    toast.add({
      title: 'Lỗi',
      description: errorMessage,
    });
  } finally {
    shuttingDown.value = shuttingDown.value.filter(id => id !== macAddress);
  }
};

// Lắng nghe các cập nhật từ server
const setupSocketListeners = () => {
  // Xử lý cập nhật thiết bị
  socket.on('device-update', (updatedDevice: Device) => {
    console.log('Received device update:', updatedDevice);

    // Find the device in our current list
    const index = devices.value.findIndex(d => d.macAddress === updatedDevice.macAddress);

    if (index >= 0) {
      // Update existing device with new data

      if(!devices.value[index]?.isConnected){
        toast.add({
          title: 'Reconnected',
          description: `Device ${updatedDevice.name} has reconnected`,
          color: 'success'
        });
      }
      devices.value[index] = {
        ...devices.value[index],
        ...updatedDevice,
        lastSeen: new Date(updatedDevice.lastSeen)
      };
      console.log('Updated existing device:', devices.value[index]);
    } else {
      // Add new device to the list
      devices.value.push({
        ...updatedDevice,
        lastSeen: new Date(updatedDevice.lastSeen)
      });
      console.log('Added new device to list');

      // Show notification for new device
      toast.add({
        title: 'New Device',
        description: `Device ${updatedDevice.name} has connected`,
        color: 'success'
      });
    }

    // Force Vue to recognize the change
    devices.value = [...devices.value];
  });

  // Xử lý thiết bị ngắt kết nối
  socket.on('device-disconnect', (macAddress: string) => {
    console.log('Received device disconnect:', macAddress);

    const device = devices.value.find(d => d.macAddress === macAddress);
    if (device) {
      device.isConnected = false;

      // Force Vue to recognize the change
      devices.value = [...devices.value];

      toast.add({
        title: 'Device Disconnected',
        description: `Device ${device.name} has disconnected`,
        color: 'warning'
      });
    }
  });

  // Xử lý thiết bị tắt máy
  socket.on('device-shutdown', (macAddress: string) => {
    console.log('Received device shutdown:', macAddress);

    const device = devices.value.find(d => d.macAddress === macAddress);
    if (device) {
      device.isConnected = false;

      // Force Vue to recognize the change
      devices.value = [...devices.value];

      toast.add({
        title: 'Device Shutdown',
        description: `Device ${device.name} has shut down`,
        color: 'info'
      });
    }
  });

  // Handle socket reconnection
  socket.on('reconnect', () => {
    console.log('Socket reconnected, refreshing device list');
    fetchDevices();
  });
};

const toast = useToast();

// Add a watcher to log device changes for debugging
watch(devices, (newDevices) => {
  console.log('Devices array updated:', newDevices);
}, { deep: true });

// Initialize component
onMounted(() => {
  console.log('DeviceList component mounted');

  // Initial data fetch
  fetchDevices().then(() => {
    console.log('Initial devices loaded:', devices.value);
  });

  // Setup socket listeners
  setupSocketListeners();

  // Set up a refresh interval (every 5 minutes)
  const refreshInterval = setInterval(() => {
    console.log('Auto-refreshing device list');
    fetchDevices();
  }, 5 * 60 * 1000);

  // Clean up interval on unmount
  onBeforeUnmount(() => {
    clearInterval(refreshInterval);
  });
});

// Clean up socket listeners when component is unmounted
onBeforeUnmount(() => {
  console.log('DeviceList component unmounting, removing socket listeners');

  // Remove all socket listeners
  socket.off('device-update');
  socket.off('device-disconnect');
  socket.off('device-shutdown');
  socket.off('reconnect');
});

// Format thời gian
const formatDate = (date?: Date) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};
</script>

<template>
  <div class="container mx-auto px-4 py-6 ">
    <!-- Header with refresh button and device count -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Device management</h1>
      <div class="flex items-center gap-2">
        <span v-if="!loading && devices.length > 0" class="text-sm">
          {{ devices.length }} devices
        </span>
        <UButton
          variant="ghost"
          icon="i-heroicons-arrow-path"
          :loading="loading"
          @click="fetchDevices"
          class="rounded-full h-10 w-10 p-0 flex items-center justify-center"
          :class="{'animate-spin': loading}"
          title="Làm mới"
        />
      </div>
    </div>

    <!-- Error message -->
    <UAlert
      v-if="error"
      variant="destructive"
      title="Lỗi"
      :description="error"
      class="mb-6"
      icon="i-heroicons-exclamation-triangle"
    />

    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-12 w-12 mb-4 text-primary" />
      <p>Loading device list...</p>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && (!devices || devices.length === 0)" class="flex flex-col items-center justify-center py-16 card rounded-lg">
      <UIcon name="i-heroicons-computer-desktop" class="h-16 w-16 mb-4" />
      <h3 class="text-xl font-medium mb-2">No devices connected</h3>
      <p class="mb-6 text-center max-w-md">
        No devices are currently connected to your account.
      </p>
      <UButton
        variant="outline"
        icon="i-heroicons-arrow-path"
        @click="fetchDevices"
      >
        Làm mới
      </UButton>
    </div>

    <!-- Device grid -->
    <div v-if="!loading && devices && devices.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="device in devices"
        :key="device.macAddress"
        class="rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
      >
        <!-- Card header with status badge -->
        <div class="p-6 pb-4 border-b card">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold truncate">{{ device.name }}</h3>
            <UBadge
              :color="device.isConnected ? 'success' : 'error'"
              class="ml-2"
              size="sm"
            >
              <div class="flex items-center gap-1">
                <div class="h-2 w-2 rounded-full" :class="device.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'"></div>
                {{ device.isConnected ? 'Connected' : 'Disconnected' }}
              </div>
            </UBadge>
          </div>
        </div>

        <!-- Card body with device details -->
        <div class="p-6 space-y-3 card">
          <div class="flex items-center">
            <UIcon name="i-heroicons-globe-alt" class="h-5 w-5 mr-3" />
            <div>
              <div class="text-sm">IP Address</div>
              <div class="font-medium">{{ device.ipAddress }}</div>
            </div>
          </div>

          <div class="flex items-center">
            <UIcon name="i-heroicons-cpu-chip" class="h-5 w-5 mr-3" />
            <div>
              <div class="text-sm">MAC Address</div>
              <div class="font-medium">{{ device.macAddress }}</div>
            </div>
          </div>

          <div class="flex items-center">
            <UIcon name="i-heroicons-clock" class="h-5 w-5  mr-3" />
            <div>
              <div class="text-sm ">Last Seen</div>
              <div class="font-medium">{{ formatDate(device.lastSeen) }}</div>
            </div>
          </div>
        </div>

        <!-- Card footer with action button -->
        <div class="p-4 card">
          <UButton
            icon="i-heroicons-power"
            :color="device.isConnected ? 'success' : 'error'"
            class="w-full"
            :loading="shuttingDown.includes(device.macAddress)"
            :disabled="!device.isConnected || shuttingDown.includes(device.macAddress)"
            @click="handleShutdown(device.macAddress)"
          >
            {{ shuttingDown.includes(device.macAddress) ? 'Shutting down...' : 'Offline' }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>




