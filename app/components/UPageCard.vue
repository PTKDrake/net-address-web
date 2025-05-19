<template>
  <div class="relative flex rounded-lg card ring ring-default w-96">
    <div class="relative flex flex-col flex-1 lg:grid gap-x-8 gap-y-4 p-4 sm:p-6">
      <slot/>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineOptions({
  name: 'UPageCard'
})

defineSlots<{
  default(): any
}>()
</script>

<style>

</style>
