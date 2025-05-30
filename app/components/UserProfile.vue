<script setup lang="ts">
import { authClient, signOut } from "~~/lib/auth-client";
import type { DropdownMenuItem } from '@nuxt/ui'

const { data: loggedIn } = await authClient.useSession(useFetch);

const userInitial = computed(() => {
  if (!loggedIn.value) return ''
  return loggedIn.value.user.name.charAt(0).toUpperCase()
})

const userAvatar = computed(() => {
  if (!loggedIn.value?.user?.image) return ''
  return loggedIn.value.user.image
})

const isLoggedIn = computed(() => !!loggedIn.value)

// Check if user is admin
const isAdmin = ref(false)

// Check admin role
onMounted(async () => {
  try {
    if (loggedIn.value?.user?.role) {
      const userRole = loggedIn.value.user.role;
      isAdmin.value = userRole === 'admin' || (Array.isArray(userRole) && userRole.includes('admin'));
    }
  } catch (error) {
    console.error('Error checking admin role:', error);
  }
})

const items = computed<DropdownMenuItem[]>(() => {
  const baseItems = [
    {
      label: 'Profile',
      icon: 'i-lucide-user',
      to: '/profile'
    },
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/settings'
    }
  ];

  // Add admin dashboard if user is admin
  if (isAdmin.value) {
    baseItems.splice(1, 0, {
      label: 'Admin Dashboard',
      icon: 'i-heroicons-shield-check',
      to: '/admin/devices'
    });
  }

  baseItems.push({
    label: 'Sign out',
    icon: 'i-lucide-log-out',
    to: '/signout'
  });

  return baseItems;
})
</script>

<template>
  <div>
    <!-- User not logged in -->
    <UButton
      v-if="!isLoggedIn"
      color="neutral"
      variant="ghost"
      icon="i-material-symbols-light:person"
      to="/login"
    />

    <!-- User is logged in -->
    <UDropdownMenu
      v-else
      size="xl"
      arrow
      :items="items"
      :ui="{
        content: 'w-48'
      }"
      :content="{
        align: 'end',
        side: 'bottom',
        sideOffset: 10
      }"
      :modal="false"
    >
      <UButton
        color="neutral"
        variant="ghost"
        class="relative"
      >
        <!-- Avatar from Google -->
        <img
          v-if="userAvatar"
          :src="userAvatar"
          :alt="loggedIn?.user?.name"
          class="size-8 rounded-full"
        >
        <!-- Initial letter avatar -->
        <div
          v-else
          class="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium"
        >
          {{ userInitial }}
        </div>
      </UButton>
    </UDropdownMenu>
  </div>
</template> 