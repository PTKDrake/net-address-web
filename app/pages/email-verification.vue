<script setup lang="ts">
import { authClient } from '~~/lib/auth-client';

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Email Verification',
  description: 'Please verify your email address to continue'
})

const email = ref('')
const loading = ref(false)
const toast = useToast()
const router = useRouter()

// Get email from query params if available
onMounted(() => {
  const route = useRoute()
  const queryEmail = route.query.email as string

  // If no email, redirect to signup page
  if (!queryEmail) {
    navigateTo('/auth/signup')
  } else {
    email.value = queryEmail
  }
})

const handleResendEmail = async () => {
  if (!email.value) {
    toast.add({
      title: "Error",
      description: "No email address found",
      color: "error",
    })
    return
  }

  loading.value = true
  try {
    await authClient.sendVerificationEmail({
      email: email.value,
      callbackURL: `/email-verification?email=${encodeURIComponent(email.value)}`,
    })
    toast.add({
      title: "Success",
      description: "Verification email has been resent",
      color: "success",
    })
  } catch (error: any) {
    console.error('Error resending verification email:', error)
    toast.add({
      title: "Error",
      description: error?.message || "Failed to resend verification email",
      color: "error",
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto space-y-6">
    <div class="flex flex-col text-center">
      <div class="mb-4 flex justify-center">
        <Icon name="i-lucide-mail" class="size-12 text-primary" />
      </div>
      <h1 class="text-2xl font-semibold text-highlighted">Check your email</h1>
      <p class="mt-2 text-base text-muted">
        We've sent a verification link to <span class="font-medium text-default">{{ email }}</span>
      </p>
    </div>

    <div class="bg-muted/50 rounded-lg p-4 space-y-4">
      <div class="flex items-start space-x-3">
        <Icon name="i-lucide-info" class="size-5 text-primary mt-0.5" />
        <div class="space-y-1">
          <p class="text-sm text-default">
            Please check your email and click the verification link to activate your account.
          </p>
          <p class="text-sm text-muted">
            If you don't see the email, check your spam folder.
          </p>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <UButton
        block
        :loading="loading"
        @click="handleResendEmail"
      >
        Resend verification email
      </UButton>

      <div class="text-center text-sm text-muted">
        <p>
          Already verified? <ULink
            to="/auth/signin"
            class="text-primary font-medium"
          >Sign in</ULink>
        </p>
      </div>
    </div>
  </div>
</template> 