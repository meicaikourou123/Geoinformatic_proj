// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/image', '@nuxt/ui'],
  css: [
    '@/assets/css/sidebar-menu.css'
  ],
  vite: {
    ssr: {
      noExternal: ['naive-ui', 'vueuc']
    }
  }
})