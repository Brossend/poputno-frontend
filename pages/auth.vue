<template>
  <AuthPageLayout />
</template>

<script setup lang="ts">
import AuthPageLayout from '~/components/auth/AuthPageLayout.vue';
import { useAuthStore } from '~/stores/auth';
import type { AuthMode } from '~/types/auth';

const pageTitle = 'Вход и регистрация — Попутно';
const pageDescription = 'Войдите или создайте аккаунт в Попутно, чтобы планировать городские путешествия, маршруты по дням и делиться поездками с друзьями.';
const route = useRoute();
const authStore = useAuthStore();

const isAuthMode = (mode: unknown): mode is AuthMode => mode === 'login' || mode === 'register';

watch(
  () => route.query.mode,
  (mode) => {
    const normalizedMode = Array.isArray(mode) ? mode[0] : mode;

    if (isAuthMode(normalizedMode)) {
      authStore.setMode(normalizedMode);
    }
  },
  { immediate: true },
);

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogType: 'website',
  twitterCard: 'summary',
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
});
</script>
