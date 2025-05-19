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

const items = ref<DropdownMenuItem[]>([
  {
    label: 'Profile',
    icon: 'i-lucide-user',
    to: '/profile'
  },
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: '/settings'
  },
  {
    label: 'Sign out',
    icon: 'i-lucide-log-out',
    to: '/signout'
  }
])
</script>

<template>
  <div>
    <!-- Chưa đăng nhập -->
    <UButton
      v-if="!isLoggedIn"
      color="gray"
      variant="ghost"
      icon="i-material-symbols-light:person"
      to="/login"
    />

    <!-- Đã đăng nhập -->
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
        color="gray"
        variant="ghost"
        class="relative"
      >
        <!-- Avatar từ Google -->
        <img
          v-if="userAvatar"
          :src="userAvatar"
          :alt="loggedIn?.user?.name"
          class="size-8 rounded-full"
        >
        <!-- Avatar chữ cái đầu -->
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