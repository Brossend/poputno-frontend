<template>
  <form class="space-y-5" novalidate @submit.prevent="handleSubmit">
    <label class="block">
      <span class="text-sm font-medium text-slate-700">Ваше имя</span>
      <input
        v-model="form.name"
        type="text"
        autocomplete="name"
        class="mt-2 h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        :class="errors.name ? 'border-red-300' : 'border-[#e5e2dc]'"
        placeholder="Алексей Иванов"
        @blur="validateName"
      >

      <span v-if="errors.name" class="mt-1.5 block text-xs text-red-600">
        {{ errors.name }}
      </span>
    </label>

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
      autocomplete="new-password"
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
      label="Создать аккаунт"
      :loading="isLoading"
      loading-text="Создаём аккаунт..."
    />
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { storeToRefs } from 'pinia';
import AuthPasswordField from '~/components/auth/AuthPasswordField.vue';
import AuthSubmitButton from '~/components/auth/AuthSubmitButton.vue';
import { useAuthStore } from '~/stores/auth';
import type { RegisterPayload } from '~/types/auth';

const authStore = useAuthStore();
const { error: authError, isLoading } = storeToRefs(authStore);

const form = reactive<RegisterPayload>({
  name: '',
  email: '',
  password: '',
});

const errors = reactive<Record<keyof RegisterPayload, string>>({
  name: '',
  email: '',
  password: '',
});

const validateName = () => {
  errors.name = form.name.trim() ? '' : 'Введите имя';
};

const validateEmail = () => {
  errors.email = form.email.trim() ? '' : 'Введите email';
};

const validatePassword = () => {
  if (!form.password) {
    errors.password = 'Введите пароль';
    return;
  }

  errors.password = form.password.length >= 8 ? '' : 'Пароль должен быть не короче 8 символов';
};

const validateForm = () => {
  validateName();
  validateEmail();
  validatePassword();

  return !errors.name && !errors.email && !errors.password;
};

const handleSubmit = async () => {
  authStore.clearError();

  if (!validateForm()) {
    return;
  }

  const response = await authStore.register({ ...form });

  if (response) {
    await navigateTo('/home');
  }
};
</script>
