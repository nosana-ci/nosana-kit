<template>
  <div class="tabs">
    <div class="tabs-header">
      <button
        v-for="(tab, index) in items"
        :key="index"
        :class="['tab-button', { active: activeTab === index }]"
        @click="activeTab = index"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tabs-content">
      <div
        v-for="(tab, index) in items"
        :key="index"
        v-show="activeTab === index"
        class="tab-panel"
      >
        <slot :name="`tab-${index}`" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  items: Array<{ label: string }>
}>()

const activeTab = ref(0)
</script>

<style scoped>
.tabs {
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.tabs-header {
  display: flex;
  background-color: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.tab-button {
  flex: 1;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab-button:hover {
  color: var(--vp-c-text-1);
  background-color: var(--vp-c-bg);
}

.tab-button.active {
  color: var(--vp-c-brand);
  border-bottom-color: var(--vp-c-brand);
  background-color: var(--vp-c-bg);
}

.tabs-content {
  padding: 1.5rem;
  background-color: var(--vp-c-bg);
}
</style>

