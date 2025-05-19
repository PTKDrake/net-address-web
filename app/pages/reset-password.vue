<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { resetPassword } from '~~/lib/auth-client'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Reset Password',
  description: 'Reset your password to continue'
})

const toast = useToast()
const route = useRoute()
const token = ref(route.query.token as string || '')
const loading = ref(false)

const schema = z.object({
  password: z.string().min(8, 'Must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Must be at least 8 characters')
})

const fields = [{
  name: 'password',
  label: 'New Password',
  type: 'password' as const,
  placeholder: 'Enter your new password',
  required: true
}, {
  name: 'confirmPassword',
  label: 'Confirm Password',
  type: 'password' as const,
  placeholder: 'Confirm your new password',
  required: true
}]

const handleResetPassword = async (payload: FormSubmitEvent<z.infer<typeof schema>>) => {
  loading.value = true
  try {
    await resetPassword({
      token: token.value,
      newPassword: payload.data.password,
      fetchOptions: {
        onError: (context) => {
          toast.add({
            title: "Please try again",
            description: context?.error?.message || "An error occurred while resetting your password",
          });
        },
        onSuccess: () => {
          toast.add({
            title: "Success",
            description: "Your password has been reset successfully",
          });
          navigateTo('/login')
        }
      }
    });
  } catch (error) {
    console.error('Error resetting password:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto space-y-6">
    <div class="flex flex-col text-center">
      <div class="mb-4 flex justify-center">
        <Icon name="i-lucide-lock" class="size-12 text-primary" />
      </div>
      <h1 class="text-2xl font-semibold text-highlighted">Set new password</h1>
      <p class="mt-2 text-base text-muted">
        Please enter your new password below.
      </p>
    </div>

    <UAuthForm
      :fields="fields"
      :schema="schema"
      title=""
      :submit="{ label: 'Reset password' }"
      @submit="handleResetPassword"
    >
      <template #description>
        Remember your password? <ULink
          to="/login"
          class="text-primary font-medium"
        >Sign in</ULink>
      </template>
    </UAuthForm>
  </div>
</template> 