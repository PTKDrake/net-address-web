<template>
  <div class="redirect-container">
    <div class="card">
      <div class="icon">🔐</div>
      <h1>Authentication Successful</h1>
      <div class="spinner"></div>
      <p>Redirecting to NetAddress application...</p>
      <p>Please wait <span class="countdown">{{ countdown }}</span> seconds</p>
      
      <div v-if="showManualInstructions" class="manual-instructions">
        <h2>⚠️ Manual Action Required</h2>
        <p>If the application didn't open automatically:</p>
        <ol>
          <li>Copy this link: <code>{{ redirectUrl }}</code></li>
          <li>Open NetAddress application manually</li>
          <li>Paste the link in the application</li>
        </ol>
        <UButton @click="tryRedirectAgain" size="lg" class="mt-4">
          Try Again
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
});

const route = useRoute();
const redirectUrl = computed(() => route.query.url as string);
const countdown = ref(3);
const showManualInstructions = ref(false);

onMounted(() => {
  if (!redirectUrl.value) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing redirect URL'
    });
  }

  const timer = setInterval(() => {
    countdown.value--;
    
    if (countdown.value <= 0) {
      clearInterval(timer);
      redirectToApp();
    }
  }, 1000);
});

const redirectToApp = () => {
  // Try to redirect to the application
  window.location.href = redirectUrl.value;
  
  // Show manual instructions if custom protocol doesn't work
  setTimeout(() => {
    showManualInstructions.value = true;
  }, 2000);
};

const tryRedirectAgain = () => {
  window.location.href = redirectUrl.value;
};

useHead({
  title: 'Redirecting to Application',
  meta: [
    { name: 'description', content: 'Redirecting to NetAddress application...' }
  ]
});
</script>

<style scoped>
.redirect-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.card {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  color: white;
  max-width: 500px;
  margin: 1rem;
}

.icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

h1 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

p {
  margin: 0.5rem 0;
  opacity: 0.9;
}

.countdown {
  font-weight: 600;
  color: #ffd700;
}

.manual-instructions {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.manual-instructions h2 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.manual-instructions ol {
  text-align: left;
  margin: 1rem 0;
}

.manual-instructions code {
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  word-break: break-all;
}
</style> 