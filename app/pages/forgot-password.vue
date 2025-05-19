<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { forgetPassword } from '~~/lib/auth-client'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Forgot Password',
  description: 'Reset your password to continue'
})

const toast = useToast()
const loading = ref(false)
const step = ref('request')

const schema = z.object({
  email: z.string().email('Invalid email')
})

const fields = [{
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}]

const handleRequestReset = async (payload: FormSubmitEvent<z.infer<typeof schema>>) => {
  loading.value = true
  try {
    toast.add({
      title: "Success",
      description: "Reset instructions have been sent to your email",
    });
    await forgetPassword({
      email: payload.data.email,
      redirectTo: '/reset-password',

    });
    step.value = 'requested'
  } catch (error) {
    console.error('Error requesting password reset:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto space-y-6">
    <!-- Request Reset Form -->
    <template v-if="step === 'request'">
      <div class="flex flex-col text-center">
        <div class="mb-4 flex justify-center">
          <Icon name="i-lucide-lock" class="size-12 text-primary" />
        </div>
        <h1 class="text-2xl font-semibold text-highlighted">Forgot your password?</h1>
        <p class="mt-2 text-base text-muted">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      <UAuthForm
        :fields="fields"
        :schema="schema"
        title=""
        :submit="{ label: 'Send reset instructions' }"
        @submit="handleRequestReset"
      >
        <template #description>
          Remember your password? <ULink
            to="/login"
            class="text-primary font-medium"
          >Sign in</ULink>
        </template>
      </UAuthForm>
    </template>

    <!-- Request Sent -->
    <template v-else>
      <div class="flex flex-col text-center">
        <div class="mb-4 flex justify-center">
          <Icon name="i-lucide-mail" class="size-12 text-primary" />
        </div>
        <h1 class="text-2xl font-semibold text-highlighted">Check your email</h1>
        <p class="mt-2 text-base text-muted">
          We've sent reset instructions to <span class="font-medium text-default">{{ email }}</span>
        </p>
      </div>

      <div class="bg-muted/50 rounded-lg p-4 space-y-4">
        <div class="flex items-start space-x-3">
          <Icon name="i-lucide-info" class="size-5 text-primary mt-0.5" />
          <div class="space-y-1">
            <p class="text-sm text-default">
              Please check your email and click the reset link to set your new password.
            </p>
            <p class="text-sm text-muted">
              If you don't see the email, check your spam folder.
            </p>
          </div>
        </div>
      </div>

      <div class="text-center text-sm text-muted">
        <p>
          Remember your password? <ULink
            to="/login"
            class="text-primary font-medium"
          >Sign in</ULink>
        </p>
      </div>
    </template>
  </div>
</template> 