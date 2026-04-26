<template>
  <form class="space-y-5" novalidate @submit.prevent="handleSubmit">
    <label class="block">
      <span class="text-sm font-medium text-slate-700">Email</span>
      <input
        v-model="form.email"
        type="email"
        autocomplete="email"
        class="mt-2 h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        :class="errors.email ? 'border-red-300' : 'border-[#e5e2dc]'"
        placeholder="alex@example.com"
        @blur="validateEmail"
      >

      <span v-if="errors.email" class="mt-1.5 block text-xs text-red-600">
        {{ errors.email }}
      </span>
    </label>

    <AuthPasswordField
      v-model="form.password"
      autocomplete="current-password"
      :error="errors.password"
      label="Пароль"
      placeholder="••••••••"
      @blur="validatePassword"
    />

    <p
      v-if="authError"
      class="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ authError }}
    </p>

    <AuthSubmitButton
      label="Войти"
      :loading="isLoading"
      loading-text="Входим..."
    />
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { storeToRefs } from 'pinia';
import AuthPasswordField from '~/components/auth/AuthPasswordField.vue';
import AuthSubmitButton from '~/components/auth/AuthSubmitButton.vue';
import { useAuthStore } from '~/stores/auth';
import type { LoginPayload } from '~/types/auth';

const authStore = useAuthStore();
const { error: authError, isLoading } = storeToRefs(authStore);

const form = reactive<LoginPayload>({
  email: '',
  password: '',
});

const errors = reactive<Record<keyof LoginPayload, string>>({
  email: '',
  password: '',
});

const validateEmail = () => {
  errors.email = form.email.trim() ? '' : 'Введите email';
};

const validatePassword = () => {
  errors.password = form.password ? '' : 'Введите пароль';
};

const validateForm = () => {
  validateEmail();
  validatePassword();

  return !errors.email && !errors.password;
};

const handleSubmit = async () => {
  authStore.clearError();

  if (!validateForm()) {
    return;
  }

  const response = await authStore.login({ ...form });

  if (response) {
    await navigateTo('/home');
  }
};
</script>
