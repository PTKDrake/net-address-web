<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
    <!-- Hero Section -->
    <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div class="container mx-auto px-4 py-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Admin Device Dashboard
            </h1>
            <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
              Manage and monitor all devices across the platform
            </p>
          </div>
          
          <!-- Admin Badge -->
          <div class="flex items-center gap-3">
            <UBadge color="primary" size="lg" class="flex items-center gap-2">
              <UIcon name="i-heroicons-shield-check" class="h-4 w-4" />
              Administrator
            </UBadge>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-8">
      <!-- Only render if user is admin -->
      <ClientOnly>
        <AdminDeviceList />
        <template #fallback>
          <div class="flex flex-col items-center justify-center py-20">
            <div class="relative">
              <div class="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <UIcon name="i-heroicons-shield-check" class="absolute inset-0 m-auto h-6 w-6 text-purple-600" />
            </div>
            <p class="mt-4 text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
          </div>
        </template>
      </ClientOnly>
    </div>
    
    <!-- Background decoration -->
    <div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div class="absolute top-0 left-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div class="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      <div class="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getSession } from '~~/lib/auth-client';

// Define page meta
definePageMeta({
  layout: 'default'
});

// Set page title and meta
useHead({
  title: 'Admin Device Dashboard',
  meta: [
    { name: 'description', content: 'Admin panel for device management across the platform' },
    { property: 'og:title', content: 'Admin Device Dashboard' },
    { property: 'og:description', content: 'Admin panel for device management across the platform' }
  ]
});

// Check admin permission on the client side as well
onMounted(async () => {
  try {
    const userSession = await getSession();
    const userRole = userSession.data?.user?.role;
    const isAdmin = userRole === 'admin' || (Array.isArray(userRole) && userRole.includes('admin'));
    
    if (!isAdmin) {
      await navigateTo('/devices');
    }
  } catch (error) {
    console.error('Admin check error:', error);
    await navigateTo('/devices');
  }
});
</script>

<style scoped>
/* Custom animations for background elements */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}
</style> 