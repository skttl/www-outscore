import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-04-28',
  ssr: false,
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@vueuse/nuxt', '@nuxtjs/i18n', '@vite-pwa/nuxt'],
  nitro: {
    preset: 'static',
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Outscore',
      short_name: 'Outscore',
      description: 'Dart scoreboard for the lives-based dart game',
      lang: 'da',
      theme_color: '#0a0a0a',
      background_color: '#0a0a0a',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
    },
    devOptions: {
      enabled: true,
      type: 'module',
      navigateFallback: '/',
    },
    client: {
      installPrompt: true,
    },
  },
  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    head: {
      title: 'Outscore',
      htmlAttrs: { lang: 'da' },
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content:
            'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
        },
        { name: 'theme-color', content: '#0a0a0a' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
    },
  },
  i18n: {
    defaultLocale: 'en',
    strategy: 'no_prefix',
    locales: [
      { code: 'da', name: 'Dansk', file: 'da.json', language: 'da-DK' },
      { code: 'en', name: 'English', file: 'en.json', language: 'en-US' },
      { code: 'de', name: 'Deutsch', file: 'de.json', language: 'de-DE' },
      { code: 'fr', name: 'Français', file: 'fr.json', language: 'fr-FR' },
      { code: 'nl', name: 'Nederlands', file: 'nl.json', language: 'nl-NL' },
      { code: 'es', name: 'Español', file: 'es.json', language: 'es-ES' },
      { code: 'it', name: 'Italiano', file: 'it.json', language: 'it-IT' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      fallbackLocale: 'en',
    },
    bundle: { optimizeTranslationDirective: false },
  },
})
