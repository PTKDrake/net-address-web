<template>
    <NuxtLink to="/" class="flex items-center gap-2">
        <ClientOnly>
            <Icon name="qlementine-icons:network-16" :size="isMobile ? '1.5em' : '2.3em'" mode="svg" />
        </ClientOnly>
        <span
class="md:text-2xl text-xl font-extrabold tracking-wide"
            style="font-family: 'Space Grotesk', sans-serif;">NetAddress</span>
    </NuxtLink>
</template>

<script setup>
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
</script>
