<template>
  <header class="border-b border-[#e8dfd2] bg-[#fbf7f1]/95 backdrop-blur">
    <div class="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <div class="min-w-0 flex-1">
<NuxtLink to="/app/trips" class="inline-flex items-center gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3f6df6] text-white shadow-[0_10px_24px_rgba(63,109,246,0.28)]">
            <svg
              aria-hidden="true"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="m15 9-2 6-4 2 2-6 4-2Z" />
            </svg>
          </span>

          <p class="truncate text-lg font-semibold text-slate-950">
            Попутно
          </p>
        </NuxtLink>
      </div>

      <nav class="hidden items-center gap-2 md:flex lg:hidden">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="rounded-full px-4 py-2 text-sm font-medium transition"
          :class="isActive(item.to)
            ? 'bg-[#163b36] text-white'
            : 'bg-white text-slate-600 hover:bg-[#f1e9dc] hover:text-slate-950'"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="hidden min-w-0 text-right sm:block">
        <p class="truncate text-sm font-medium text-slate-900">
          {{ user?.name || 'Путешественник' }}
        </p>

        <p class="truncate text-xs text-slate-500">
          {{ user?.email || 'Аккаунт Попутно' }}
        </p>
      </div>

      <button
        type="button"
        class="inline-flex h-11 items-center justify-center rounded-2xl border border-[#d7c9b8] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#c7b39b] hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isLoading"
        @click="handleLogout"
      >
        {{ isLoading ? 'Выходим...' : 'Выйти' }}
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/stores/auth';

const route = useRoute();
const authStore = useAuthStore();
const { isLoading, user } = storeToRefs(authStore);

const navigation = [
  {
    label: 'Поездки',
    to: '/app/trips',
  },
  {
    label: 'Новая поездка',
    to: '/app/trips/create',
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

const handleLogout = async () => {
  await authStore.logout();
  await navigateTo('/auth', { replace: true });
};
</script>
