<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg';
    label?: string;
  }>(),
  {
    size: 'md',
    label: '',
  },
);
</script>

<template>
  <div class="loader" :class="`loader--${size}`" role="status" aria-live="polite">
    <span class="loader__spinner" aria-hidden="true" />
    <span v-if="label" class="loader__label">{{ label }}</span>
  </div>
</template>

<style scoped>
.loader {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.loader--sm .loader__spinner {
  width: 14px;
  height: 14px;
  border-width: 2px;
}

.loader--md .loader__spinner {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.loader--lg .loader__spinner {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

.loader__spinner {
  display: block;
  flex-shrink: 0;
  border-radius: 50%;
  border-style: solid;
  border-color: #dbeafe;
  border-top-color: #2563eb;
  animation: spin 0.7s linear infinite;
}

.loader__label {
  color: #6b7280;
  font-size: 14px;
  white-space: nowrap;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
