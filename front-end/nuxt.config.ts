import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  future: {
    compatibilityVersion: 4,
  },
  ssr: false,
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:4000/api',
      imageBase: process.env.IMAGE_CDN_URL || 'http://localhost:4000/images'
    }
  },
  modules: ['@vueuse/motion/nuxt'],
  css: ['~/assets/css/main.css'],
  nitro: {
    routeRules: {
      '/api/**': { proxy: (process.env.API_BASE_URL || 'http://localhost:4000/api') + '/**' },
      '/images/**': { proxy: (process.env.IMAGE_CDN_URL || 'http://localhost:4000/images') + '/**' }
    },
    externals: {
      external: ['better-sqlite3', '@prisma/client']
    },
    rollupConfig: {
      external: ['better-sqlite3', '@prisma/client']
    }
  },
  vite: {
    plugins: [
      tailwindcss()
    ],
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ],
      exclude: ['@prisma/client', '.prisma/client']
    }
  },
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@100..900&display=swap' }
      ]
    }
  }
})
