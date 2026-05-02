<template>
  <aside class="hidden w-72 shrink-0 lg:block">
    <div class="sticky top-24 rounded-[28px] border border-[#e5ddd2] bg-white/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6b4f]">
        Попутно
      </p>

      <h2 class="mt-3 text-lg font-semibold text-slate-950">
        Рабочая область
      </h2>

      <p class="mt-2 text-sm leading-6 text-slate-500">
        Здесь находятся ваши поездки, маршруты по дням и карта с местами.
      </p>

      <nav class="mt-6 space-y-2">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="block rounded-2xl border px-4 py-3 text-sm transition"
          :class="isActive(item.to)
            ? 'border-[#d6c6af] bg-[#fbf4ea] text-slate-950 shadow-sm'
            : 'border-transparent bg-[#f8f5ef] text-slate-600 hover:border-[#e5ddd2] hover:bg-white hover:text-slate-950'"
        >
          <span class="block font-medium">{{ item.label }}</span>
          <span class="mt-1 block text-xs text-slate-500">{{ item.description }}</span>
        </NuxtLink>
      </nav>
    </div>
  </aside>
</template>

<script setup lang="ts">
const route = useRoute();

const navigation = [
  {
    label: 'Мои поездки',
    to: '/app/trips',
    description: 'Список всех ваших маршрутов',
  },
  {
    label: 'Создать поездку',
    to: '/app/trips/create',
    description: 'Форма создания новой поездки',
  },
];

const isTripsSectionRoute = (path: string) => (
  path === '/app/trips' || /^\/app\/trips\/[^/]+$/.test(path)
);

const isActive = (path: string) => (
  path === '/app/trips'
    ? isTripsSectionRoute(route.path)
    : route.path === path
);
</script>
