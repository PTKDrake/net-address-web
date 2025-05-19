<template>
    <!-- Theme Toggle -->
    <UTooltip :text="colorMode.value === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
          <ClientOnly>
            <UButton
              :icon="colorMode.value === 'dark' ? 'material-symbols-light:sunny' : 'material-symbols-light:dark-mode'"
              :size="isMobile ? 'lg' : 'xl'" variant="ghost" color="surface" class="cursor-pointer" @click="toggleColorMode" />
          </ClientOnly>
        </UTooltip>
</template>

<script setup>
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const colorMode = useColorMode()

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>
