<template>
  <section class="space-y-8">
    <div class="max-w-2xl">
      <p class="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
        Попутно
      </p>

      <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        Создать поездку
      </h1>

      <p class="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
        Выберите город, задайте даты и темп, чтобы сразу перейти к работе над маршрутом.
      </p>
    </div>

    <TripCreateForm />
  </section>
</template>

<script setup lang="ts">
import TripCreateForm from '~/components/trips/TripCreateForm.vue';

definePageMeta({
  layout: 'app',
});

useSeoMeta({
  title: 'Создать поездку — Попутно',
  description: 'Создание новой поездки и маршрута в приложении Попутно.',
});
</script>
