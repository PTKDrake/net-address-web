<script setup lang="ts">
// This component is a wrapper that forces admin mode for DeviceList
const isAdminMode = ref(true);
</script>

<template>
  <div>
    <!-- Admin-specific header -->
    <div class="mb-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
      <div class="flex items-center gap-3 mb-3">
        <UIcon name="i-heroicons-shield-check" class="h-6 w-6 text-purple-600" />
        <h2 class="text-xl font-semibold text-purple-900 dark:text-purple-100">
          Administrator Dashboard
        </h2>
      </div>
      <p class="text-purple-700 dark:text-purple-300">
        You have full access to view and manage all devices across the platform. 
        Use the user filter to view devices by specific users.
      </p>
    </div>

    <!-- Device List Component -->
    <DeviceListClient />
  </div>
</template> 