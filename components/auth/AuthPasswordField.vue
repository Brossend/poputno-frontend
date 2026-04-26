<template>
  <label class="block">
    <span class="text-sm font-medium text-slate-700">{{ label }}</span>

    <span class="relative mt-2 block">
      <input
        :value="modelValue"
        :type="isPasswordVisible ? 'text' : 'password'"
        :autocomplete="autocomplete"
        class="h-11 w-full rounded-xl border bg-white px-4 pr-12 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        :class="error ? 'border-red-300' : 'border-[#e5e2dc]'"
        :placeholder="placeholder"
        @blur="emit('blur')"
        @input="handleInput"
      >

      <button
        type="button"
        class="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        :aria-label="isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'"
        @click="isPasswordVisible = !isPasswordVisible"
      >
        <svg
          v-if="isPasswordVisible"
          aria-hidden="true"
          class="size-5"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.8"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.5 5.2A9.5 9.5 0 0 1 12 5c5 0 8.5 4 10 7a16.5 16.5 0 0 1-2.4 3.5" />
          <path d="M6.4 6.4A16.1 16.1 0 0 0 2 12c1.5 3 5 7 10 7 1.6 0 3-.4 4.3-1" />
        </svg>

        <svg
          v-else
          aria-hidden="true"
          class="size-5"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.8"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </span>

    <span v-if="error" class="mt-1.5 block text-xs text-red-600">
      {{ error }}
    </span>
  </label>
</template>

<script setup lang="ts">
import { ref } from 'vue';

withDefaults(defineProps<{
  autocomplete?: string;
  error?: string;
  label: string;
  modelValue: string;
  placeholder?: string;
}>(), {
  autocomplete: 'current-password',
  error: '',
  placeholder: '••••••••',
});

const emit = defineEmits<{
  blur: [];
  'update:modelValue': [value: string];
}>();

const isPasswordVisible = ref(false);

const handleInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
};
</script>
