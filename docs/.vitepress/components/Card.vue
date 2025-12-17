<template>
  <div class="card">
    <div v-if="title" class="card-header">
      <h3 class="card-title">{{ title }}</h3>
    </div>
    <div class="card-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<style scoped>
.card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
  background-color: var(--vp-c-bg-soft);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.card:hover {
  border-color: var(--vp-c-brand);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--vp-c-text-1);
}

.card-content {
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.card-content :deep(p) {
  margin: 0.5rem 0;
}

.card-content :deep(p:first-child) {
  margin-top: 0;
}

.card-content :deep(p:last-child) {
  margin-bottom: 0;
}
</style>

