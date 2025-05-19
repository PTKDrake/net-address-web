<template>
      <div class="card rounded-xl shadow-sm p-6 w-full">
        <div class="w-full space-y-6">
          <div class="flex flex-col text-center">
            <div class="mb-4 flex justify-center">
              <Icon name="i-lucide-user" class="size-8" mode="svg" />
            </div>
            <span class="text-xl text-pretty font-semibold text-highlighted">{{ title }}</span>
            <span class="mt-1 text-base text-pretty text-muted">{{ description }}</span>
          </div>

        <div class="gap-y-6 flex flex-col">
          <!-- Social Login Buttons -->
          <div v-if="providers.length > 0" class="space-y-3">
            <UButton
              v-for="provider in providers"
              :key="provider.label"
              class="w-full inline-flex items-center justify-center gap-2"
              color="neutral"
              variant="subtle"
              :icon="provider.icon"
              @click="provider.onClick"
            >
              {{ provider.label }}
            </UButton>

            <div data-orientation="horizontal" role="separator" class="flex items-center align-center text-center w-full flex-row">
              <div class="border-default w-full border-solid border-t"/>
              <div class="font-medium text-default flex mx-3 whitespace-nowrap"><span class="text-sm">or</span></div>
              <div class="border-default w-full border-solid border-t"/>
            </div>
          </div>

          <!-- Form Fields -->
          <form class="space-y-4" @submit.prevent="onSubmit">
            <div v-for="field in fields" :key="field.name" class="space-y-2">
              <UFormField 
                :label="field.label" 
                :name="field.name"
                :error="errors[field.name]"
              >
                <UInput
                  v-model="form[field.name]"
                  class="w-full"
                  :type="field.type === 'password' ? (showPassword ? 'text' : 'password') : field.type"
                  :placeholder="field.placeholder"
                  :name="field.name"
                  :ui="{ trailing: field.type === 'password' ? 'pe-1' : undefined }"
                  :error="!!errors[field.name]"
                  @blur="handleBlur(field.name)"
                  @input="handleInput(field.name)"
                >
                  <template v-if="field.type === 'password'" #trailing>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      :aria-label="showPassword ? 'Hide password' : 'Show password'"
                      :aria-pressed="showPassword"
                      aria-controls="password"
                      @click="showPassword = !showPassword"
                    />
                  </template>
                </UInput>
              </UFormField>
            </div>

            <div v-if="props.showRememberMe || props.showForgotPassword" class="flex items-center justify-between">
              <UCheckbox
                v-if="props.showRememberMe"
                v-model="form.remember"
                label="Remember me"
                name="remember"
                :model-value="form.remember"
                @update:model-value="form.remember = $event"
              />
              <ULink
                v-if="props.showForgotPassword"
                to="/forgot-password"
                class="text-sm text-primary font-medium"
              >
                Forgot password?
              </ULink>
            </div>

            <UButton
              type="submit"
              color="primary"
              variant="solid"
              class="w-full flex justify-center"
              :loading="loading"
            >
              {{ submit?.label || 'Continue' }}
            </UButton>
          </form>
        </div>

        <!-- Footer -->
        <div class="text-center text-sm text-muted">
          <slot name="description">
            Don't have an account? <ULink
              to="/signup"
              class="text-primary font-medium"
            >Sign up</ULink>.
          </slot>
        </div>

        <div class="text-center text-sm text-muted">
          <slot name="footer">
            By signing in, you agree to our <ULink
              to="/terms"
              class="text-primary font-medium"
            >Terms of Service</ULink>.
          </slot>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

interface Provider {
  label: string
  icon: string
  onClick: () => void
}

interface Field {
  name: string
  type: 'text' | 'email' | 'password'
  label: string
  placeholder: string
  required?: boolean
}

interface Props {
  title?: string
  description?: string
  icon?: string
  fields: Field[]
  providers?: Provider[]
  schema?: z.ZodType
  submit?: {
    label?: string
  }
  showRememberMe?: boolean
  showForgotPassword?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Welcome back',
  description: 'Enter your credentials to access your account.',
  providers: () => [],
  submit: () => ({}),
  showRememberMe: false,
  showForgotPassword: false
})

const emit = defineEmits<{
  submit: [data: any]
}>()

// Initialize form with all fields from props
const form = ref<Record<string, any>>({})

// Set up initial form values from fields
onMounted(() => {
  props.fields.forEach(field => {
    form.value[field.name] = ''
  })

  // Add remember me if needed
  if (props.showRememberMe) {
    form.value.remember = false
  }
})

const loading = ref(false)
const showPassword = ref(false)
const errors = ref<Record<string, string>>({})
const touched = ref<Record<string, boolean>>({})

async function validateField(fieldName: string) {
  if (!props.schema) return

  try {
    const fieldSchema = z.object({
      [fieldName]: props.schema.shape[fieldName]
    })

    await fieldSchema.parseAsync({
      [fieldName]: form.value[fieldName]
    })

    // Special case for password confirmation
    if (fieldName === 'confirmPassword' && form.value.password) {
      if (form.value.password !== form.value.confirmPassword) {
        errors.value[fieldName] = "Passwords don't match"
        return
      }
    }

    errors.value[fieldName] = ''
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors.find(err => err.path[0] === fieldName)
      if (fieldError) {
        errors.value[fieldName] = fieldError.message
      }
    }
  }
}

function handleBlur(fieldName: string) {
  touched.value[fieldName] = true
  validateField(fieldName)
}

function handleInput(fieldName: string) {
  if (touched.value[fieldName]) {
    validateField(fieldName)
  }
}

// Watch for form changes
watch(form, (newValue) => {
  Object.keys(touched.value).forEach(key => {
    if (touched.value[key]) {
      validateField(key)
    }
  })
}, { deep: true })

async function onSubmit() {
  loading.value = true

  // Mark all fields as touched
  Object.keys(form.value).forEach(key => {
    touched.value[key] = true
  })

  try {
    if (props.schema) {
      const validated = await props.schema.parseAsync(form.value)
      emit('submit', { data: validated })
    } else {
      emit('submit', { data: form.value })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.value = error.errors.reduce((acc, err) => {
        const path = err.path.join('.')
        acc[path] = err.message
        return acc
      }, {} as Record<string, string>)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style></style>
