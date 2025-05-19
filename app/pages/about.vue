<script setup lang="ts">
// About page component
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div class="card rounded-xl shadow-sm p-8 max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">About Net Address</h1>
      
      <div class="space-y-6">
        <section>
          <h2 class="text-2xl font-semibold mb-3">Our Mission</h2>
          <p class="text-lg">
            Net Address is a modern solution for managing and monitoring your network devices. 
            Our platform provides a simple and intuitive way to keep track of all your connected 
            devices, their status, and perform remote operations when needed.
          </p>
        </section>
        
        <section>
          <h2 class="text-2xl font-semibold mb-3">Key Features</h2>
          <ul class="list-disc pl-6 space-y-2">
            <li>Real-time device monitoring</li>
            <li>Remote shutdown capabilities</li>
            <li>Automatic IP and MAC address tracking</li>
            <li>Secure connection management</li>
            <li>User-friendly interface</li>
          </ul>
        </section>
        
        <section>
          <h2 class="text-2xl font-semibold mb-3">Technology</h2>
          <p class="text-lg">
            Built with modern web technologies including Nuxt.js, Vue, and WebSockets, 
            Net Address offers a responsive and reliable experience across all your devices.
          </p>
        </section>
        
        <section>
          <h2 class="text-2xl font-semibold mb-3">Contact</h2>
          <p class="text-lg">
            For support or inquiries, please contact our team at 
            <a href="mailto:support@netaddress.com" class="text-primary hover:underline">
              support@netaddress.com
            </a>
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional styling if needed */
</style>