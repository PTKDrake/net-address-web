<template>
  <nav
    class="navbar fixed backdrop-blur-md z-50 py-2 px-3 md:px-10 drop-shadow-2xl transition-all duration-300 card rounded-2xl left-[2%] right-[2%]"
    :class="{ 
      'top-[2%] md:left-[18%] md:right-[18%]': (!isHidden || isMenuOpen) && lastScrollY < 50,
      'top-[2%] md:left-[25%] md:right-[25%]': (!isHidden || isMenuOpen) && lastScrollY >= 50,
      '-top-20 md:left-[25%] md:right-[25%]': isHidden && !isMenuOpen,
    }">
    <div class="flex items-center justify-between">
      <ClientOnly>
        <UButton
          icon="material-symbols-light:menu" 
          :size="isMobile ? 'lg' : 'xl'" 
          variant="link" 
          color="surface" 
          class="cursor-pointer"
          @click="toggleMenu" 
        />
      </ClientOnly>

      <!-- Logo -->
      <div class="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:flex-1 md:flex md:justify-center">
        <AppLogo />
      </div>

      <!-- Right Section -->
      <div class="flex items-center gap-2">

        <!-- User Avatar (Desktop Only) -->
        <div v-if="!isMobile">
          <UserProfile />
        </div>

        <ThemeToggler />
      </div>
    </div>

    <!-- Menu Dropdown -->
    <div v-if="isMenuOpen" class="w-full mt-4 py-4 border-t border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Features Menu -->
        <div class="card rounded-xl p-4 flex flex-col items-center">
          <h3 class="font-semibold text-lg mb-3">Features</h3>
          <div class="space-y-2">
            <NuxtLink to="/devices" class="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <UIcon name="i-heroicons-computer-desktop" class="h-5 w-5" />
              <span>Device Management</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Resources Menu -->
        <div class="card rounded-xl p-4 flex flex-col items-center">
          <h3 class="font-semibold text-lg mb-3">Resources</h3>
          <div class="space-y-2">
            <NuxtLink to="/about" class="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <UIcon name="i-heroicons-information-circle" class="h-5 w-5" />
              <span>About Us</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const isMenuOpen = ref(false)
const isUserOpen = ref(false)
const isScrolled = ref(false)
const isHidden = ref(false)
const lastScrollY = ref(0)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  if (isMenuOpen.value) {
    isUserOpen.value = false
    isHidden.value = false // Always show navbar when menu is open
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('nav') && !e.target.closest('button')) {
      isMenuOpen.value = false
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', () => { })
})

const handleScroll = () => {
  // Update scrolled state
  isScrolled.value = window.scrollY > 50

  // Handle navbar hide/show based on scroll direction
  const currentScrollY = window.scrollY

  // Don't hide navbar at the top of the page
  if (currentScrollY <= 50) {
    isHidden.value = false
    lastScrollY.value = currentScrollY
    return
  }

  // Determine scroll direction and update navbar visibility
  if (currentScrollY > lastScrollY.value) {
    // Scrolling down - hide navbar
    isHidden.value = true
  } else {
    // Scrolling up - show navbar
    isHidden.value = false
  }

  // Update last scroll position
  lastScrollY.value = currentScrollY
}
</script>
