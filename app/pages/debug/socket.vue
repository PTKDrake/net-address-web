<template>
  <div class="container mx-auto px-4 py-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Socket.IO Debug Panel</h1>
      
      <!-- Socket Status -->
      <UCard class="mb-6">
        <template #header>
          <h2 class="text-xl font-semibold">Socket Connection Status</h2>
        </template>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <div 
                class="w-3 h-3 rounded-full" 
                :class="debugInfo.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
              ></div>
              <span class="font-medium">Connection Status</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ debugInfo.connected ? 'Connected' : 'Disconnected' }}
            </p>
          </div>
          
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-identification" class="h-4 w-4" />
              <span class="font-medium">Socket ID</span>
            </div>
            <p class="text-xs font-mono text-gray-600 dark:text-gray-400">
              {{ debugInfo.socketId || 'Not connected' }}
            </p>
          </div>
          
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-cpu-chip" class="h-4 w-4" />
              <span class="font-medium">Active Components</span>
            </div>
            <p class="text-2xl font-bold text-blue-600">
              {{ debugInfo.componentCount }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Active Components -->
      <UCard class="mb-6">
        <template #header>
          <h2 class="text-xl font-semibold">Active Components</h2>
        </template>
        
        <div v-if="debugInfo.activeComponents.length === 0" class="text-center py-8 text-gray-500">
          No active components registered
        </div>
        
        <div v-else class="space-y-2">
          <div 
            v-for="component in debugInfo.activeComponents" 
            :key="component"
            class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-cube" class="h-4 w-4 text-blue-600" />
              <span class="font-mono text-sm">{{ component }}</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Real-time Events -->
      <UCard class="mb-6">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Real-time Events</h2>
            <UButton 
              @click="clearEventLog" 
              variant="outline" 
              size="sm"
              icon="i-heroicons-trash"
            >
              Clear Log
            </UButton>
          </div>
        </template>
        
        <div class="h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
          <div v-if="eventLog.length === 0" class="text-center text-gray-500 py-8">
            No events logged yet
          </div>
          
          <div v-else class="space-y-1">
            <div 
              v-for="(event, index) in eventLog.slice().reverse()" 
              :key="index"
              class="text-xs font-mono p-2 rounded border-l-4"
              :class="getEventClass(event.type)"
            >
              <div class="flex items-center justify-between">
                <span class="font-semibold">{{ event.type }}</span>
                <span class="text-gray-500">{{ formatTime(event.timestamp) }}</span>
              </div>
              <div class="mt-1 text-gray-600 dark:text-gray-300">
                {{ event.data }}
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Actions -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">Debug Actions</h2>
        </template>
        
        <div class="flex gap-4">
          <UButton @click="refreshDebugInfo" icon="i-heroicons-arrow-path">
            Refresh Info
          </UButton>
          
          <UButton @click="simulateEvent" variant="outline" icon="i-heroicons-play">
            Simulate Event
          </UButton>
          
          <UButton @click="exportDebugData" variant="outline" icon="i-heroicons-document-arrow-down">
            Export Debug Data
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getSocketDebugInfo } from '~/components/socket';

// Page meta
definePageMeta({
  layout: 'default'
});

useHead({
  title: 'Socket.IO Debug Panel'
});

// Reactive data
const debugInfo = ref({
  connected: false,
  socketId: null as string | null | undefined,
  activeComponents: [] as string[],
  componentCount: 0
});

const eventLog = ref<Array<{
  type: string;
  data: string;
  timestamp: Date;
}>>([]);

// Methods
const refreshDebugInfo = () => {
  debugInfo.value = getSocketDebugInfo();
  addEventLog('DEBUG', 'Debug info refreshed');
};

const addEventLog = (type: string, data: string) => {
  eventLog.value.push({
    type,
    data,
    timestamp: new Date()
  });
  
  // Keep only last 50 events
  if (eventLog.value.length > 50) {
    eventLog.value = eventLog.value.slice(-50);
  }
};

const clearEventLog = () => {
  eventLog.value = [];
  addEventLog('DEBUG', 'Event log cleared');
};

const simulateEvent = () => {
  addEventLog('SIMULATE', 'Test event simulated');
};

const exportDebugData = () => {
  const data = {
    debugInfo: debugInfo.value,
    eventLog: eventLog.value,
    timestamp: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `socket-debug-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  addEventLog('EXPORT', 'Debug data exported');
};

const getEventClass = (type: string) => {
  switch (type) {
    case 'ERROR':
      return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    case 'WARN':
      return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    case 'INFO':
      return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    case 'SUCCESS':
      return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    default:
      return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
  }
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString();
};

// Auto-refresh debug info
onMounted(() => {
  refreshDebugInfo();
  
  const interval = setInterval(() => {
    const newInfo = getSocketDebugInfo();
    
    // Check for changes
    if (newInfo.connected !== debugInfo.value.connected) {
      addEventLog(newInfo.connected ? 'SUCCESS' : 'ERROR', 
        `Socket ${newInfo.connected ? 'connected' : 'disconnected'}`);
    }
    
    if (newInfo.componentCount !== debugInfo.value.componentCount) {
      addEventLog('INFO', 
        `Component count changed: ${debugInfo.value.componentCount} → ${newInfo.componentCount}`);
    }
    
    debugInfo.value = newInfo;
  }, 1000);
  
  onBeforeUnmount(() => {
    clearInterval(interval);
  });
});
</script> 