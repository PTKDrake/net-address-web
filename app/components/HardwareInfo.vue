<script setup lang="ts">
import type { HardwareInfo } from '~~/db/deviceSchema';

interface Props {
  hardware?: HardwareInfo;
  isExpanded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isExpanded: false
});

const isExpanded = ref(props.isExpanded);

// Format hardware information for display
const formatHardwareInfo = (hardware?: HardwareInfo) => {
  if (!hardware) return null;
  
  return {
    cpu: hardware.cpu ? {
      display: `${hardware.cpu.model} (${hardware.cpu.cores} cores, ${hardware.cpu.speed}GHz)`,
      usage: hardware.cpu.usage
    } : null,
    memory: hardware.memory ? {
      display: `${hardware.memory.used}GB / ${hardware.memory.total}GB`,
      usage: Math.round((hardware.memory.used / hardware.memory.total) * 100)
    } : null,
    storage: hardware.storage ? {
      display: `${hardware.storage.used}GB / ${hardware.storage.total}GB`,
      usage: Math.round((hardware.storage.used / hardware.storage.total) * 100)
    } : null,
    gpu: hardware.gpu ? {
      display: hardware.gpu.model,
      memory: hardware.gpu.memory ? `${hardware.gpu.memory}GB` : null,
      usage: hardware.gpu.usage
    } : null,
    os: hardware.os ? `${hardware.os.name} ${hardware.os.version} (${hardware.os.architecture})` : null,
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
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
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

const hardwareInfo = computed(() => formatHardwareInfo(props.hardware));
</script>

<template>
  <div v-if="hardware" class="border-t pt-4">
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-semibold flex items-center">
        <UIcon name="i-heroicons-computer-desktop" class="h-4 w-4 mr-2" />
        Hardware Information
      </h4>
      <UButton
        variant="ghost"
        size="xs"
        :icon="isExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
        @click="isExpanded = !isExpanded"
      />
    </div>
    
    <div class="space-y-2 text-sm">
      <!-- CPU -->
      <div v-if="hardwareInfo?.cpu" class="flex items-start justify-between">
        <div class="flex items-start flex-1">
          <UIcon name="i-heroicons-cpu-chip" class="h-4 w-4 mr-2 mt-0.5 text-orange-500" />
          <div class="flex-1">
            <div class="text-xs text-gray-500">CPU</div>
            <div class="text-xs">{{ hardwareInfo.cpu.display }}</div>
          </div>
        </div>
        <UBadge 
          v-if="hardwareInfo.cpu.usage !== undefined" 
          :color="getUsageColor(hardwareInfo.cpu.usage)"
          size="xs"
        >
          {{ hardwareInfo.cpu.usage }}%
        </UBadge>
      </div>

      <!-- Memory -->
      <div v-if="hardwareInfo?.memory" class="flex items-start justify-between">
        <div class="flex items-start flex-1">
          <UIcon name="i-heroicons-circle-stack" class="h-4 w-4 mr-2 mt-0.5 text-green-500" />
          <div class="flex-1">
            <div class="text-xs text-gray-500">Memory</div>
            <div class="text-xs">{{ hardwareInfo.memory.display }}</div>
          </div>
        </div>
        <UBadge 
          :color="getUsageColor(hardwareInfo.memory.usage)"
          size="xs"
        >
          {{ hardwareInfo.memory.usage }}%
        </UBadge>
      </div>

      <!-- Storage -->
      <div v-if="hardwareInfo?.storage" class="flex items-start justify-between">
        <div class="flex items-start flex-1">
          <UIcon name="i-heroicons-server-stack" class="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
          <div class="flex-1">
            <div class="text-xs text-gray-500">Storage</div>
            <div class="text-xs">{{ hardwareInfo.storage.display }}</div>
          </div>
        </div>
        <UBadge 
          :color="getUsageColor(hardwareInfo.storage.usage)"
          size="xs"
        >
          {{ hardwareInfo.storage.usage }}%
        </UBadge>
      </div>

      <!-- Expanded content -->
      <div v-if="isExpanded" class="space-y-2 pt-2 border-t">
        <!-- GPU -->
        <div v-if="hardwareInfo?.gpu" class="flex items-start justify-between">
          <div class="flex items-start flex-1">
            <UIcon name="i-heroicons-tv" class="h-4 w-4 mr-2 mt-0.5 text-red-500" />
            <div class="flex-1">
              <div class="text-xs text-gray-500">GPU</div>
              <div class="text-xs">{{ hardwareInfo.gpu.display }}</div>
              <div v-if="hardwareInfo.gpu.memory" class="text-xs text-gray-400">{{ hardwareInfo.gpu.memory }}</div>
            </div>
          </div>
          <UBadge 
            v-if="hardwareInfo.gpu.usage !== undefined" 
            :color="getUsageColor(hardwareInfo.gpu.usage)"
            size="xs"
          >
            {{ hardwareInfo.gpu.usage }}%
          </UBadge>
        </div>

        <!-- OS -->
        <div v-if="hardwareInfo?.os" class="flex items-start">
          <UIcon name="i-heroicons-command-line" class="h-4 w-4 mr-2 mt-0.5 text-indigo-500" />
          <div>
            <div class="text-xs text-gray-500">Operating System</div>
            <div class="text-xs">{{ hardwareInfo.os }}</div>
          </div>
        </div>

        <!-- Uptime -->
        <div v-if="hardwareInfo?.uptime" class="flex items-start">
          <UIcon name="i-heroicons-clock" class="h-4 w-4 mr-2 mt-0.5 text-yellow-500" />
          <div>
            <div class="text-xs text-gray-500">Uptime</div>
            <div class="text-xs">{{ hardwareInfo.uptime }}</div>
          </div>
        </div>

        <!-- Motherboard -->
        <div v-if="hardwareInfo?.motherboard" class="flex items-start">
          <UIcon name="i-heroicons-circuit-board" class="h-4 w-4 mr-2 mt-0.5 text-purple-500" />
          <div>
            <div class="text-xs text-gray-500">Motherboard</div>
            <div class="text-xs">{{ hardwareInfo.motherboard }}</div>
          </div>
        </div>

        <!-- Network Interfaces -->
        <div v-if="hardwareInfo?.network && hardwareInfo.network.length > 0" class="flex items-start">
          <UIcon name="i-heroicons-wifi" class="h-4 w-4 mr-2 mt-0.5 text-cyan-500" />
          <div>
            <div class="text-xs text-gray-500">Network Interfaces</div>
            <div class="space-y-1">
              <div 
                v-for="(interface_, index) in hardwareInfo.network" 
                :key="index"
                class="text-xs"
              >
                {{ interface_.name }} ({{ interface_.type }})
                <span v-if="interface_.speed" class="text-gray-400">- {{ interface_.speed }}Mbps</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- No Hardware Info -->
  <div v-else class="border-t pt-4">
    <div class="text-sm text-gray-500 italic flex items-center">
      <UIcon name="i-heroicons-exclamation-triangle" class="h-4 w-4 mr-2" />
      No hardware information available
    </div>
  </div>
</template> 