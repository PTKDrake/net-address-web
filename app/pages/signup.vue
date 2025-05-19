<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { signUp, signIn } from "~~/lib/auth-client";

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Sign up',
  description: 'Create an account to get started'
})

const toast = useToast()

const fields = [{
  name: 'firstName',
  type: 'text' as const,
  label: 'First Name',
  placeholder: 'Enter your first name',
  required: true
}, {
  name: 'lastName',
  type: 'text' as const,
  label: 'Last Name',
  placeholder: 'Enter your last name'
}, {
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password' as const,
  placeholder: 'Enter your password',
  required: true
}, {
  name: 'confirmPassword',
  label: 'Confirm Password',
  type: 'password' as const,
  placeholder: 'Confirm your password',
  required: true
}]

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons:google',
  onClick: async () => {
    await signIn.social({
        provider: 'google',
        callbackURL: '/',
        fetchOptions: {
          onError: (context) => {
            console.log(context);
            toast.add({
              title: "Please try again",
              description: context?.error?.message || "Unknown errors",
            });
          }
        }
      })    
  }
}];

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

const handleSignupEmail = async (payload: FormSubmitEvent<Schema>) => {
  await signUp.email({
    email: payload.data.email,
    password: payload.data.password,
    name: `${payload.data.firstName} ${payload.data.lastName}`,
    firstName: payload.data.firstName,
    lastName: payload.data.lastName,
    callbackURL: `/`,
    fetchOptions: {
      onError: (context) => {
        toast.add({
          title: "Sign up failed",
          description: context?.error?.message || "Please check your email and password",
          color: 'danger',
        });
        if(context?.error?.code == "USER_ALREADY_EXISTS"){
          navigateTo('/login');
        }
      },
      onSuccess: () => {
        navigateTo(`/email-verification?email=${encodeURIComponent(payload.data.email)}`);
      }
    }
  })
}

function onSubmit(payload: FormSubmitEvent<Schema>) {
  handleSignupEmail(payload)
}
</script>

<template>
  <UAuthForm
:fields="fields" :schema="schema" :providers="providers" title="Create an account"
    description="Enter your information to create an account" :submit="{ label: 'Create account' }" @submit="onSubmit">
    <template #description>
      Already have an account? <ULink to="/login" class="text-primary font-medium">Login</ULink>.
    </template>

    <template #footer>
      By signing up, you agree to our <ULink to="#" class="text-primary font-medium">Terms of Service</ULink>.
    </template>
  </UAuthForm>
</template>
