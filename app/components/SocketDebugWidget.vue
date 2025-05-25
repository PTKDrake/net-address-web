<template>
  <div class="fixed bottom-4 right-4 z-50" v-if="showWidget">
    <UCard class="w-80 shadow-2xl border border-orange-200 dark:border-orange-800">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-bug-ant" class="h-4 w-4 text-orange-600" />
            <span class="font-semibold text-orange-900 dark:text-orange-100">Socket Debug</span>
          </div>
          <UButton
            @click="showWidget = false"
            variant="ghost"
            size="xs"
            icon="i-heroicons-x-mark"
          />
        </div>
      </template>
      
      <div class="space-y-3 text-xs">
        <!-- Connection Status -->
        <div class="flex items-center justify-between">
          <span>Connection:</span>
          <div class="flex items-center gap-1">
            <div 
              class="w-2 h-2 rounded-full" 
              :class="debugInfo.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
            ></div>
            <span :class="debugInfo.connected ? 'text-green-600' : 'text-red-600'">
              {{ debugInfo.connected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
        </div>
        
        <!-- Socket ID -->
        <div class="flex items-center justify-between">
          <span>Socket ID:</span>
          <span class="font-mono text-xs">{{ debugInfo.socketId || 'N/A' }}</span>
        </div>
        
        <!-- Component Count -->
        <div class="flex items-center justify-between">
          <span>Components:</span>
          <span class="font-bold text-blue-600">{{ debugInfo.componentCount }}</span>
        </div>
        
        <!-- Active Components -->
        <div v-if="debugInfo.activeComponents.length > 0">
          <div class="text-gray-600 dark:text-gray-400 mb-1">Active Components:</div>
          <div class="space-y-1">
            <div 
              v-for="component in debugInfo.activeComponents" 
              :key="component"
              class="text-xs font-mono p-1 bg-blue-50 dark:bg-blue-900/20 rounded border-l-2 border-blue-500"
            >
              {{ component }}
            </div>
          </div>
        </div>
        
        <!-- Route Info -->
        <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-1">
            <span>Current Route:</span>
            <span class="font-mono text-xs">{{ currentRoute }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>Generated ID:</span>
            <span class="font-mono text-xs text-blue-600">{{ generatedComponentId }}</span>
          </div>
        </div>
        
        <!-- Events Count -->
        <div class="flex items-center justify-between">
          <span>Events Received:</span>
          <span class="font-bold text-green-600">{{ eventCount }}</span>
        </div>
        
        <!-- Last Event -->
        <div v-if="lastEvent">
          <div class="text-gray-600 dark:text-gray-400 mb-1">Last Event:</div>
          <div class="text-xs font-mono p-1 bg-green-50 dark:bg-green-900/20 rounded">
            {{ lastEvent.type }}: {{ lastEvent.data }}
            <div class="text-gray-500">{{ formatTime(lastEvent.timestamp) }}</div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex gap-2">
          <UButton @click="refreshDebugInfo" size="xs" variant="outline">
            Refresh
          </UButton>
          <UButton @click="simulateEvent" size="xs" variant="outline">
            Test Event
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
  
  <!-- Toggle Button -->
  <div v-else class="fixed bottom-4 right-4 z-50">
    <UButton
      @click="showWidget = true"
      color="warning"
      variant="outline"
      size="sm"
      icon="i-heroicons-bug-ant"
    >
      Debug
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { getSocketDebugInfo } from '~/components/socket';

// Props
interface Props {
  componentId?: string;
  autoRefresh?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: true
});

// Reactive data
const showWidget = ref(false);
const debugInfo = ref({
  connected: false,
  socketId: null as string | null | undefined,
  activeComponents: [] as string[],
  componentCount: 0
});

const eventCount = ref(0);
const lastEvent = ref<{
  type: string;
  data: string;
  timestamp: Date;
} | null>(null);

// Computed
const currentRoute = computed(() => {
  const route = useRoute();
  return route.path;
});

const generatedComponentId = computed(() => {
  if (props.componentId) return props.componentId;
  
  const route = useRoute();
  // This should match the logic in DeviceList.client.vue
  return `device-list-${route.path}-user`; // simplified for demo
});

// Methods
const refreshDebugInfo = () => {
  debugInfo.value = getSocketDebugInfo();
  addEvent('DEBUG', 'Info refreshed');
};

const addEvent = (type: string, data: string) => {
  eventCount.value++;
  lastEvent.value = {
    type,
    data,
    timestamp: new Date()
  };
};

const simulateEvent = () => {
  addEvent('TEST', 'Simulated event');
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString();
};

// Auto-refresh
onMounted(() => {
  refreshDebugInfo();
  
  if (props.autoRefresh) {
    const interval = setInterval(() => {
      const newInfo = getSocketDebugInfo();
      
      // Track changes
      if (newInfo.connected !== debugInfo.value.connected) {
        addEvent(newInfo.connected ? 'CONNECT' : 'DISCONNECT', 
          `Socket ${newInfo.connected ? 'connected' : 'disconnected'}`);
      }
      
      if (newInfo.componentCount !== debugInfo.value.componentCount) {
        addEvent('COMPONENT', 
          `Count: ${debugInfo.value.componentCount} → ${newInfo.componentCount}`);
      }
      
      debugInfo.value = newInfo;
    }, 1000);
    
    onBeforeUnmount(() => {
      clearInterval(interval);
    });
  }
});

// Show widget on development
if (process.dev) {
  showWidget.value = true;
}
</script>

<style scoped>
/* Ensure widget is always on top */
.z-50 {
  z-index: 9999;
}
</style> 