<template>
  <Layout>
    <template #nav-bar-title-before>
      <a href="/" class="logo-link">
        <Logo :width="'160px'" :white="isDark" :animated="true" />
      </a>
    </template>
  </Layout>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import Logo from '../components/Logo.vue';

const { isDark } = useData();
const Layout = DefaultTheme.Layout;
</script>

<style scoped>
.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}
</style>
