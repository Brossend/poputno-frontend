<template>
  <button
    type="submit"
    class="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
    :disabled="loading"
  >
    <span>{{ loading ? loadingText : label }}</span>

    <svg
      aria-hidden="true"
      class="size-4"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label: string;
  loading?: boolean;
  loadingText?: string;
}>(), {
  loading: false,
  loadingText: 'Загрузка...',
});
</script>
