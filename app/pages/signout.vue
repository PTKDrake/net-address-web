<script setup lang="ts">
import { authClient } from '~~/lib/auth-client';

const toast = useToast();

onMounted(async () => {
  try {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigateTo('/auth/signin');
        },
        onError: (ctx) => {
          console.error('Sign out error:', ctx.error);
          toast.add({
            title: 'Sign out error',
            description: 'An error occurred while signing out',
            color: 'error'
          });
        }
      }
    });

    toast.add({
      title: 'Signed out',
      description: 'You have been signed out successfully',
      color: 'success'
    });
  } catch (error) {
    console.error('Sign out error:', error);
    toast.add({
      title: 'Sign out error',
      description: 'An error occurred while signing out',
      color: 'error'
    });
  }
});
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h1 class="text-2xl font-bold mb-4">Signing out...</h1>
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
    </div>
  </div>
</template>