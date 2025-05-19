import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2024-11-01',
    devtools: { enabled: true },
    future: {
        compatibilityVersion: 4
    },
    nitro: {
        experimental: {
            websocket: true
        }
    },
    app: {
        head: {
            title: 'Net Address',
        }
    },
    modules: [
      '@nuxt/ui',
      '@nuxtjs/color-mode',
      '@nuxt/eslint',
      '@nuxt/fonts',
      '@nuxt/icon',
      '@nuxt/image',
      '@vueuse/nuxt',
    ],
    build: {
        transpile: [
        ],
    },
    css: [
        '@/assets/styles.css'
    ],
    colorMode: {
        preference: 'system',
        fallback: 'light',
        classSuffix: '',
    },
    routeRules: {
        '/auth/*': {
            ssr: false,
        },
        '/register': {
            ssr: false,
        },
        '/login': {
            ssr: false,
        },
        '/complete-profile': {
            ssr: false,
        },
        '/signout': {
            ssr: false,
        },
    },
    vite: {
        plugins: [
            tailwindcss() as any,
        ],
    },
})
