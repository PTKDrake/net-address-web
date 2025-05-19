<script setup lang="ts">
// Home page component
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <!-- Hero Section -->
    <div class="card rounded-xl shadow-sm p-8 mb-12 text-center">
      <h1 class="text-4xl font-bold mb-4">Welcome to Net Address</h1>
      <p class="text-xl max-w-3xl mx-auto mb-8">
        The modern solution for managing and monitoring your network devices
      </p>
      <img src="/network.png" alt="Network Illustration" class="md:max-w-md mx-auto mb-6" />
      <UButton to="/about" size="lg" color="primary">Learn More</UButton>
    </div>

    <!-- Features Section -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div class="card rounded-xl shadow-sm p-6 text-center">
        <UIcon name="i-heroicons-computer-desktop" class="h-16 w-16 mx-auto mb-4" />
        <h2 class="text-2xl font-semibold mb-3">Device Management</h2>
        <p>Monitor and manage all your connected devices from one central dashboard.</p>
      </div>

      <div class="card rounded-xl shadow-sm p-6 text-center">
        <UIcon name="i-heroicons-power" class="h-16 w-16 mx-auto mb-4" />
        <h2 class="text-2xl font-semibold mb-3">Remote Control</h2>
        <p>Perform remote operations like shutdown on your devices with a single click.</p>
      </div>

      <div class="card rounded-xl shadow-sm p-6 text-center">
        <UIcon name="i-heroicons-shield-check" class="h-16 w-16 mx-auto mb-4" />
        <h2 class="text-2xl font-semibold mb-3">Secure Connection</h2>
        <p>All connections are encrypted and secure, ensuring your network's safety.</p>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="card rounded-xl shadow-sm p-8 text-center">
      <h2 class="text-3xl font-bold mb-4">Ready to get started?</h2>
      <p class="text-xl mb-6">Connect your first device and experience the power of Net Address</p>
      <div class="flex justify-center gap-4">
        <UButton to="/about" size="lg" variant="outline">Learn More</UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional styling if needed */
</style>
