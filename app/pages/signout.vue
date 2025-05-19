<script setup lang="ts">
import { signOut } from "~~/lib/auth-client";

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Signing out...',
  description: 'Please wait while we sign you out'
})

const toast = useToast()

onMounted(async () => {
  const result = await signOut({
    fetchOptions: {
      onError: (context) => {
        navigateTo('/login')
        toast.add({
          title: 'Lỗi đăng xuất',
          description: 'Đã xảy ra lỗi khi đăng xuất',
          variant: 'destructive'
        });
      },
      onSuccess: () => {
        navigateTo('/login');
        toast.add({
          title: 'Đã đăng xuất',
          description: 'Bạn đã đăng xuất thành công',
          variant: 'success'
        });
      }
    }
  });

  // Đảm bảo thông báo hiển thị trước

})
</script>

<template>
  <div class="w-full max-w-md mx-auto space-y-6">
    <div class="flex flex-col text-center">
      <div class="mb-4 flex justify-center">
        <Icon name="i-lucide-log-out" class="size-12 text-primary animate-spin" />
      </div>
      <h1 class="text-2xl font-semibold text-highlighted">Signing out...</h1>
      <p class="mt-2 text-base text-muted">
        Please wait while we sign you out of your account.
      </p>
    </div>
  </div>
</template>