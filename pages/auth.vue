<template>
  <AuthPageLayout />
</template>

<script setup lang="ts">
import AuthPageLayout from '~/components/auth/AuthPageLayout.vue';

const pageTitle = 'Вход и регистрация — Попутно';
const pageDescription = 'Войдите или создайте аккаунт в Travel Planner, чтобы планировать городские путешествия, маршруты по дням и делиться поездками с друзьями.';

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
