<template>
  <div class="container px-4 py-8 flex flex-col items-center gap-y-15">
    <h1 class="text-2xl font-bold ">
      Devices linked to your account
    </h1>
    
    <!-- Sử dụng client component để xử lý kết nối Socket.IO -->
    <ClientOnly>
      <DeviceList />
      <template #fallback>
        <div class="w-full text-center py-10">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin h-10 w-10" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>

// Cài đặt tiêu đề trang
useHead({
  title: 'Devices management',
  meta: [
    { name: 'description', content: 'Devices management remotely' }
  ]
});
</script>

<style scoped>
</style>