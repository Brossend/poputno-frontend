<template>
  <section
    class="relative -mt-[72px] min-h-screen overflow-hidden bg-cover bg-center pt-[72px] text-white"
    :style="heroBackgroundStyle"
  >
    <div class="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-8 lg:py-24">
      <div class="max-w-3xl">
        <h1 class="text-5xl font-semibold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
          Планируй идеальный
          <span class="bg-gradient-to-r from-[#7da0ff] to-[#b9c8ff] bg-clip-text text-transparent">
            городской маршрут
          </span>
        </h1>

        <p class="mt-7 max-w-2xl text-lg leading-8 text-blue-100/85 sm:text-xl">
          Добавляй места, строй маршруты по дням и делись поездкой с друзьями — всё в одном приложении. Без таблиц, без суеты.
        </p>

        <div class="mt-10 flex flex-col gap-3 sm:flex-row">
          <NuxtLink
            to="/auth?mode=register"
            class="inline-flex h-12 items-center justify-center rounded-2xl bg-[#3f6df6] px-6 text-sm font-semibold text-white shadow-xl shadow-blue-950/30 transition hover:bg-[#315fe0]"
          >
            Начать бесплатно
          </NuxtLink>

          <NuxtLink
            to="/auth"
            class="inline-flex h-12 items-center justify-center rounded-2xl border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Войти в аккаунт
          </NuxtLink>
        </div>
      </div>

      <div class="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-blue-100/70">
              Маршрут
            </p>
            <h2 class="mt-1 text-xl font-semibold text-white">
              Москва · 3 дня
            </h2>
          </div>

          <span class="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-200/20">
            Готово
          </span>
        </div>

        <div class="mt-6 space-y-3">
          <div
            v-for="day in days"
            :key="day.title"
            class="rounded-2xl border border-white/10 bg-[#07142b]/45 p-4"
          >
            <p class="text-sm font-semibold text-white">
              {{ day.title }}
            </p>
            <p class="mt-2 text-sm leading-6 text-blue-100/75">
              {{ day.places }}
            </p>
          </div>
        </div>

        <div class="mt-5 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm text-blue-100">
          <span>Всего: 9 мест</span>
          <span>18.4 км</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import landingHeroUrl from '~/assets/images/b90f96ee54b70eef5b396e22ecf6f7f5.jpg';

const days = [
  {
    title: 'День 1',
    places: 'Красная площадь, ГУМ, Зарядье',
  },
  {
    title: 'День 2',
    places: 'ВДНХ, Останкинская башня, Ботанический сад',
  },
  {
    title: 'День 3',
    places: 'Парк Горького, Третьяковская галерея, Арбат',
  },
];

const heroBackgroundStyle = {
  backgroundImage: `linear-gradient(120deg, rgba(5, 18, 38, 0.94), rgba(7, 20, 43, 0.78)), url("${landingHeroUrl}")`,
};
</script>
