<template>
  <div class="layout">
    <client-only>
      <SidebarMenu />
    </client-only>
    <NuxtPage />
  </div>
</template>

<script setup>
import SidebarMenu from '@/components/SidebarMenu.vue'
</script>

<style>
.layout,
html, body, #__nuxt, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>