<script setup>
useSeoMeta({
  title: 'WARDANA | Premium T-Shirts & Wardrobe Essentials',
  description: 'Discover the art of simplicity with WARDANA. High-end, logo-free t-shirts crafted from the finest Egyptian cotton.',
  ogTitle: 'WARDANA | Modern Luxury Essentials',
  ogDescription: 'Defining modern luxury through minimal design and maximum quality.',
  ogSiteName: 'WARDANA',
  ogLocale: 'en_US',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

useHead({
  htmlAttrs: {
    lang: 'en'
  },
  meta: [
    { name: 'keywords', content: 'luxury t-shirts, premium cotton tees, minimal fashion, wardana, high-end basics' },
    { name: 'author', content: 'WARDANA' },
    { name: 'robots', content: 'index, follow' },
  ]
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>