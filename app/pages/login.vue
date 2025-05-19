<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { signIn } from "~~/lib/auth-client";

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Login',
  description: 'Login to your account to continue'
})

const toast = useToast()

const fields = [{
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password' as const,
  placeholder: 'Enter your password'
}]

const providers = [
  {
    label: 'Google',
    icon: 'i-simple-icons-google',
    onClick: async () => {
      await signIn.social({
        provider: 'google',
        callbackURL: '/',
        fetchOptions: {
          onError: (context) => {
            toast.add({
              title: "Please try again",
              description: context?.error?.message || "Please check your email and password",
            });
          },
          onSuccess: (context) => {
          }
        }
      })
    }
  }
];

const handleLoginEmail = async (payload: FormSubmitEvent<Schema>) => {
  await signIn.email({
    email: payload.data.email,
    password: payload.data.password,
    callbackURL: '/',
    fetchOptions: {
      onError: (context) => {
        toast.add({
          title: "Please try again",
          description: context?.error?.message || "Please check your email and password",
        });
      },
    }
  })
}

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
  remember: z.boolean().optional()
})

type Schema = z.output<typeof schema>
</script>

<template>
  <UAuthForm
:fields="fields" :schema="schema" :providers="providers" title="Welcome back" icon="i-lucide-lock"
    :show-remember-me="true" :show-forgot-password="true" @submit="handleLoginEmail">
    <template #description>
      Don't have an account? <ULink to="/signup" class="text-primary font-medium">Sign up</ULink>.
    </template>

    <template #footer>
      By signing in, you agree to our <ULink to="#" class="text-primary font-medium">Terms of Service</ULink>.
    </template>
  </UAuthForm>
</template>
