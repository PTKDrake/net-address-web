<template>
  <UAuthForm 
    :fields="fields" 
    :schema="schema" 
    title="Complete your profile" 
    description="Please provide additional information to complete your profile"
    :ui="{
      wrapper: 'w-full max-w-md mx-auto',
      title: 'text-2xl font-bold text-primary',
      description: 'text-muted mt-2',
      form: 'space-y-6'
    }"
    :loading="isSubmitting"
    @submit="submitProfile"
  >
    <template #description>
      <div/>
    </template>
    <template #footer>
        Your information is protected by our <ULink to="#" class="text-primary font-medium">Privacy Policy</ULink>.
    </template>
  </UAuthForm>
</template>

<script lang="ts" setup>
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import { useSession, updateUser } from '~~/lib/auth-client';

definePageMeta({
  layout: 'auth'
});

useSeoMeta({
  title: 'Complete your profile',
  description: 'Complete your profile information'
});

const session = useSession();
const router = useRouter();
const toast = useToast();
const isSubmitting = ref(false);

// Define fields for form
const fields = [{
  name: 'firstName',
  type: 'text' as const,
  label: 'First name',
  placeholder: 'Enter your first name',
  required: true
}, {
  name: 'lastName',
  type: 'text' as const,
  label: 'Last name',
  placeholder: 'Enter your last name',
  required: true
}];

// Define validation schema
const schema = z.object({
  firstName: z.string().min(1, 'Please enter your first name'),
  lastName: z.string().min(1, 'Please enter your last name'),
});

type Schema = z.output<typeof schema>;

// If already have first name and last name, redirect to home page
onMounted(() => {
  if (session.value?.data?.user?.name) {
    navigateTo('/dashboard');
  }
});

const submitProfile = async (event: FormSubmitEvent<Schema>) => {
  try {
    isSubmitting.value = true;
    
    // Get data from validated form
    const { firstName, lastName } = event.data;
    
    // Use updateUser from better-auth
    await updateUser({
      firstName: firstName.trim(),
      lastName: lastName.trim()
    });

    toast.add({
      title: 'Success',
      description: 'Your profile has been updated',
      color: 'success'
    });

    // Redirect to home page
    navigateTo('/dashboard');
  } catch (error) {
    console.error('Error updating profile:', error);
    toast.add({
      title: 'Error',
      description: 'Unable to update profile. Please try again.',
      color: 'error'
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script> 