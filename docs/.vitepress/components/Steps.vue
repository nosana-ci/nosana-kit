<template>
  <div class="steps">
    <div
      v-for="(step, index) in steps"
      :key="index"
      :class="['step', { active: index === currentStep, completed: index < currentStep }]"
    >
      <div class="step-number">{{ index + 1 }}</div>
      <div class="step-content">
        <h4 v-if="step.title" class="step-title">{{ step.title }}</h4>
        <div class="step-body">
          <slot :name="`step-${index}`" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide, computed } from 'vue'

const props = defineProps<{
  items?: Array<{ title?: string }>
}>()

const currentStep = ref(0)

provide('steps', {
  currentStep: computed(() => currentStep.value),
  setCurrentStep: (index: number) => {
    currentStep.value = index
  },
})

const steps = computed(() => props.items || [])
</script>

<style scoped>
.steps {
  margin: 2rem 0;
}

.step {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  position: relative;
}

.step:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 0.75rem;
  top: 2.5rem;
  width: 2px;
  height: calc(100% + 0.5rem);
  background-color: var(--vp-c-divider);
}

.step.completed::after {
  background-color: var(--vp-c-brand);
}

.step-number {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background-color: var(--vp-c-divider);
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 1;
}

.step.active .step-number {
  background-color: var(--vp-c-brand);
  color: white;
}

.step.completed .step-number {
  background-color: var(--vp-c-brand);
  color: white;
}

.step-content {
  flex: 1;
  padding-top: 0.125rem;
}

.step-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-text-1);
}

.step-body {
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.step-body :deep(p) {
  margin: 0.5rem 0;
}

.step-body :deep(p:first-child) {
  margin-top: 0;
}

.step-body :deep(p:last-child) {
  margin-bottom: 0;
}
</style>

