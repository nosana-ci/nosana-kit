<template>
  <div :class="['callout', `callout-${type}`]">
    <div class="callout-header">
      <span v-if="title" class="callout-title">{{ title }}</span>
      <span v-else class="callout-title">{{ defaultTitle }}</span>
    </div>
    <div class="callout-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?: 'tip' | 'warning' | 'danger' | 'info' | 'note'
  title?: string
}>()

const defaultTitles = {
  tip: 'Tip',
  warning: 'Warning',
  danger: 'Danger',
  info: 'Info',
  note: 'Note',
} as const

const defaultTitle = computed(() => {
  return props.type ? defaultTitles[props.type] : 'Note'
})
</script>

<style scoped>
.callout {
  padding: 1rem 1.25rem;
  margin: 1.25rem 0;
  border-left: 4px solid;
  border-radius: 4px;
  background-color: var(--vp-c-bg-soft);
}

.callout-tip {
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
}

.callout-warning {
  border-color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.1);
}

.callout-danger {
  border-color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.callout-info {
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
}

.callout-note {
  border-color: #6b7280;
  background-color: rgba(107, 114, 128, 0.1);
}

.callout-header {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.callout-title {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.callout-content {
  font-size: 0.875rem;
  line-height: 1.6;
}

.callout-content :deep(p) {
  margin: 0.5rem 0;
}

.callout-content :deep(p:first-child) {
  margin-top: 0;
}

.callout-content :deep(p:last-child) {
  margin-bottom: 0;
}

.callout-content :deep(a) {
  color: var(--vp-c-brand);
  text-decoration: none;
}

.callout-content :deep(a:hover) {
  text-decoration: underline;
}
</style>

