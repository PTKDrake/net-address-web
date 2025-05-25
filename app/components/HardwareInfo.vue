<script setup lang="ts">
import type { HardwareInfo } from '~~/db/deviceSchema';

interface Props {
  hardware?: HardwareInfo;
  isExpanded?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

const props = withDefaults(defineProps<Props>(), {
  isExpanded: false,
  variant: 'default'
});

const isExpanded = ref(props.isExpanded);

// Format hardware information for display
const formatHardwareInfo = (hardware?: HardwareInfo) => {
  if (!hardware) return null;
  
  return {
    cpu: hardware.cpu ? {
      display: `${hardware.cpu.model}`,
      cores: hardware.cpu.cores,
      speed: hardware.cpu.speed,
      usage: hardware.cpu.usage
    } : null,
    memory: hardware.memory ? {
      display: `${hardware.memory.used}GB / ${hardware.memory.total}GB`,
      used: hardware.memory.used,
      total: hardware.memory.total,
      usage: Math.round((hardware.memory.used / hardware.memory.total) * 100)
    } : null,
    storage: hardware.storage ? {
      display: `${hardware.storage.used}GB / ${hardware.storage.total}GB`,
      used: hardware.storage.used,
      total: hardware.storage.total,
      usage: Math.round((hardware.storage.used / hardware.storage.total) * 100)
    } : null,
    gpu: hardware.gpu ? {
      display: hardware.gpu.model,
      memory: hardware.gpu.memory ? `${hardware.gpu.memory}GB` : null,
      usage: hardware.gpu.usage
    } : null,
    os: hardware.os ? `${hardware.os.name} ${hardware.os.version}` : null,
    uptime: hardware.os?.uptime ? formatUptime(hardware.os.uptime) : null,
    motherboard: hardware.motherboard ? `${hardware.motherboard.manufacturer} ${hardware.motherboard.model}` : null,
    network: hardware.network?.interfaces || []
  };
};

// Format uptime in human readable format
const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Get usage color based on percentage
const getUsageColor = (usage?: number) => {
  if (!usage) return 'neutral';
  if (usage < 50) return 'success';
  if (usage < 80) return 'warning';
  return 'error';
};

// Get gradient color for progress bars
const getGradientColor = (usage?: number) => {
  if (!usage) return 'from-gray-200 to-gray-300';
  if (usage < 50) return 'from-green-400 to-green-600';
  if (usage < 80) return 'from-yellow-400 to-yellow-600';
  return 'from-red-400 to-red-600';
};

const hardwareInfo = computed(() => formatHardwareInfo(props.hardware));
</script>

<template>
  <!-- Compact variant for small cards -->
  <div v-if="variant === 'compact' && hardware" class="space-y-3">
    <!-- CPU Usage -->
    <div v-if="hardwareInfo?.cpu?.usage !== undefined" class="space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 rounded-full bg-orange-500"></div>
          <span class="text-sm font-medium">CPU</span>
        </div>
        <span class="text-sm font-semibold">{{ hardwareInfo.cpu.usage }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="h-2 rounded-full bg-gradient-to-r transition-all duration-300"
          :class="getGradientColor(hardwareInfo.cpu.usage)"
          :style="{ width: `${hardwareInfo.cpu.usage}%` }"
        ></div>
      </div>
    </div>

    <!-- Memory Usage -->
    <div v-if="hardwareInfo?.memory" class="space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 rounded-full bg-blue-500"></div>
          <span class="text-sm font-medium">RAM</span>
        </div>
        <span class="text-sm font-semibold">{{ hardwareInfo.memory.usage }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="h-2 rounded-full bg-gradient-to-r transition-all duration-300"
          :class="getGradientColor(hardwareInfo.memory.usage)"
          :style="{ width: `${hardwareInfo.memory.usage}%` }"
        ></div>
      </div>
    </div>

    <!-- Storage Usage -->
    <div v-if="hardwareInfo?.storage" class="space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 rounded-full bg-purple-500"></div>
          <span class="text-sm font-medium">Storage</span>
        </div>
        <span class="text-sm font-semibold">{{ hardwareInfo.storage.usage }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="h-2 rounded-full bg-gradient-to-r transition-all duration-300"
          :class="getGradientColor(hardwareInfo.storage.usage)"
          :style="{ width: `${hardwareInfo.storage.usage}%` }"
        ></div>
      </div>
    </div>
  </div>

  <!-- Default and detailed variants -->
  <div v-else-if="hardware" class="space-y-4">
    <div class="flex items-center justify-between">
      <h4 class="text-lg font-semibold flex items-center">
        <UIcon name="i-heroicons-computer-desktop" class="h-5 w-5 mr-2 text-blue-500" />
        Hardware Info
      </h4>
      <UButton
        v-if="variant === 'default'"
        variant="ghost"
        size="xs"
        :icon="isExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
        @click="isExpanded = !isExpanded"
      />
    </div>

    <!-- Performance Metrics Grid -->
    <div class="flex flex-wrap justify-center gap-4">
      <!-- CPU Card -->
      <div v-if="hardwareInfo?.cpu" class="flex-1 basis-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-2">
            <UIcon name="i-heroicons-cpu-chip" class="h-5 w-5 text-orange-600" />
            <span class="font-medium text-orange-900 dark:text-orange-100">CPU</span>
          </div>
          <UBadge :color="getUsageColor(hardwareInfo.cpu.usage)" size="sm">
            {{ hardwareInfo.cpu.usage || 0 }}%
          </UBadge>
        </div>
        <div class="space-y-2">
          <div class="w-full bg-orange-200 dark:bg-orange-800 rounded-full h-3">
            <div 
              class="h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
              :style="{ width: `${hardwareInfo.cpu.usage || 0}%` }"
            ></div>
          </div>
          <div class="text-sm text-orange-700 dark:text-orange-300">
            {{ hardwareInfo.cpu.cores }} cores • {{ hardwareInfo.cpu.speed }}GHz
          </div>
        </div>
      </div>

      <!-- Memory Card -->
      <div v-if="hardwareInfo?.memory" class="flex-1 basis-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-2">
            <UIcon name="i-heroicons-circle-stack" class="h-5 w-5 text-blue-600" />
            <span class="font-medium text-blue-900 dark:text-blue-100">Memory</span>
          </div>
          <UBadge :color="getUsageColor(hardwareInfo.memory.usage)" size="sm">
            {{ hardwareInfo.memory.usage }}%
          </UBadge>
        </div>
        <div class="space-y-2">
          <div class="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3">
            <div 
              class="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
              :style="{ width: `${hardwareInfo.memory.usage}%` }"
            ></div>
          </div>
          <div class="text-sm text-blue-700 dark:text-blue-300">
            {{ hardwareInfo.memory.used }}GB / {{ hardwareInfo.memory.total }}GB
          </div>
        </div>
      </div>

      <!-- Storage Card -->
      <div v-if="hardwareInfo?.storage" class="flex-1 basis-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-2">
            <UIcon name="i-heroicons-server-stack" class="h-5 w-5 text-purple-600" />
            <span class="font-medium text-purple-900 dark:text-purple-100">Storage</span>
          </div>
          <UBadge :color="getUsageColor(hardwareInfo.storage.usage)" size="sm">
            {{ hardwareInfo.storage.usage }}%
          </UBadge>
        </div>
        <div class="space-y-2">
          <div class="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-3">
            <div 
              class="h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500"
              :style="{ width: `${hardwareInfo.storage.usage}%` }"
            ></div>
          </div>
          <div class="text-sm text-purple-700 dark:text-purple-300">
            {{ hardwareInfo.storage.used }}GB / {{ hardwareInfo.storage.total }}GB
          </div>
        </div>
      </div>
    </div>

    <!-- Expanded content -->
    <div v-if="isExpanded || variant === 'detailed'" class="space-y-4 pt-4 border-t">
      <!-- System Info Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- GPU -->
        <div v-if="hardwareInfo?.gpu" class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4 border border-red-200 dark:border-red-800 min-h-[120px] max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-red-300 dark:scrollbar-thumb-red-600 scrollbar-track-red-100 dark:scrollbar-track-red-900/20 hover:scrollbar-thumb-red-400 dark:hover:scrollbar-thumb-red-500">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <UIcon name="i-heroicons-tv" class="h-5 w-5 text-red-600" />
              <span class="font-medium text-red-900 dark:text-red-100">GPU</span>
            </div>
            <UBadge 
              v-if="hardwareInfo.gpu.usage !== undefined" 
              :color="getUsageColor(hardwareInfo.gpu.usage)"
              size="sm"
            >
              {{ hardwareInfo.gpu.usage }}%
            </UBadge>
          </div>
          <div class="space-y-2">
            <div class="text-sm text-red-700 dark:text-red-300 break-words leading-relaxed">
              {{ hardwareInfo.gpu.display }}
            </div>
            <div v-if="hardwareInfo.gpu.memory" class="text-xs text-red-600 dark:text-red-400">
              Memory: {{ hardwareInfo.gpu.memory }}
            </div>
          </div>
        </div>

        <!-- Operating System -->
        <div v-if="hardwareInfo?.os" class="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800 min-h-[120px] max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-300 dark:scrollbar-thumb-indigo-600 scrollbar-track-indigo-100 dark:scrollbar-track-indigo-900/20 hover:scrollbar-thumb-indigo-400 dark:hover:scrollbar-thumb-indigo-500">
          <div class="flex items-center space-x-2 mb-3">
            <UIcon name="i-heroicons-command-line" class="h-5 w-5 text-indigo-600" />
            <span class="font-medium text-indigo-900 dark:text-indigo-100">Operating System</span>
          </div>
          <div class="space-y-2">
            <div class="text-sm text-indigo-700 dark:text-indigo-300 break-words leading-relaxed">
              {{ hardwareInfo.os }}
            </div>
            <div v-if="hardwareInfo.uptime" class="text-xs text-indigo-600 dark:text-indigo-400">
              Uptime: {{ hardwareInfo.uptime }}
            </div>
          </div>
        </div>

        <!-- Motherboard -->
        <div v-if="hardwareInfo?.motherboard" class="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800 min-h-[120px] max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-300 dark:scrollbar-thumb-emerald-600 scrollbar-track-emerald-100 dark:scrollbar-track-emerald-900/20 hover:scrollbar-thumb-emerald-400 dark:hover:scrollbar-thumb-emerald-500">
          <div class="flex items-center space-x-2 mb-3">
            <UIcon name="i-heroicons-circuit-board" class="h-5 w-5 text-emerald-600" />
            <span class="font-medium text-emerald-900 dark:text-emerald-100">Motherboard</span>
          </div>
          <div class="space-y-2">
            <div class="text-sm text-emerald-700 dark:text-emerald-300 break-words leading-relaxed">
              {{ hardwareInfo.motherboard }}
            </div>
          </div>
        </div>

        <!-- Network -->
        <div v-if="hardwareInfo?.network && hardwareInfo.network.length > 0" class="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800 min-h-[120px] max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-300 dark:scrollbar-thumb-cyan-600 scrollbar-track-cyan-100 dark:scrollbar-track-cyan-900/20 hover:scrollbar-thumb-cyan-400 dark:hover:scrollbar-thumb-cyan-500">
          <div class="flex items-center space-x-2 mb-3">
            <UIcon name="i-heroicons-wifi" class="h-5 w-5 text-cyan-600" />
            <span class="font-medium text-cyan-900 dark:text-cyan-100">Network Interfaces</span>
          </div>
          <div class="space-y-3">
            <div 
              v-for="(interface_, index) in hardwareInfo.network" 
              :key="index"
              class="p-2 bg-cyan-100/50 dark:bg-cyan-800/20 rounded border border-cyan-200/50 dark:border-cyan-700/30"
            >
              <div class="text-sm text-cyan-700 dark:text-cyan-300 font-medium break-words">
                {{ interface_.name }}
              </div>
              <div class="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
                Type: {{ interface_.type }}
                <span v-if="interface_.speed" class="ml-2">Speed: {{ interface_.speed }}Mbps</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- No Hardware Info -->
  <div v-else class="p-6 text-center">
    <UIcon name="i-heroicons-exclamation-triangle" class="h-12 w-12 mx-auto mb-3 text-gray-400" />
    <div class="text-sm text-gray-500">No hardware information available</div>
  </div>
</template>

<style scoped>
/* Custom scrollbar styling */
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  border-radius: 3px;
  transition: all 0.2s ease;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  transition: all 0.2s ease;
}

/* Ensure text breaks properly in small containers */
.break-words {
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}
</style> 