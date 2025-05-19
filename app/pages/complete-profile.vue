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

// Định nghĩa fields cho form
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

// Định nghĩa schema validation
const schema = z.object({
  firstName: z.string().min(1, 'Please enter your first name'),
  lastName: z.string().min(1, 'Please enter your last name'),
});

type Schema = z.output<typeof schema>;

// Nếu đã có first name và last name rồi thì chuyển hướng về trang chủ
onMounted(() => {
  const userData = session.value?.data?.user;
  if (userData?.firstName && userData?.lastName) {
    router.push('/');
  }
});

const submitProfile = async (event: FormSubmitEvent<Schema>) => {
  try {
    isSubmitting.value = true;
    
    // Lấy dữ liệu từ form đã xác thực
    const { firstName, lastName } = event.data;
    
    // Sử dụng updateUser từ better-auth
    await updateUser({
      firstName: firstName.trim(),
      lastName: lastName.trim()
    });

    toast.add({
      title: 'Thành công',
      description: 'Hồ sơ của bạn đã được cập nhật',
      variant: 'success'
    });

    // Chuyển hướng đến trang chủ
    router.push('/');
  } catch (error) {
    console.error('Error updating profile:', error);
    toast.add({
      title: 'Lỗi',
      description: 'Không thể cập nhật hồ sơ. Vui lòng thử lại.',
      variant: 'destructive'
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script> 