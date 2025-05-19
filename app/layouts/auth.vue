<template>
  <div class="flex justify-center border border-muted relative p-4 rounded-md">
    <div data-orientation="vertical" class="h-screen flex items-center justify-center px-4">
      <div class="absolute right-8 top-8 rounded-full z-10">
        <ThemeToggler />
      </div>
      <UPageCard variant="subtle" class="max-w-sm w-full">
        <slot />
      </UPageCard>
    </div>
  </div>
</template>
