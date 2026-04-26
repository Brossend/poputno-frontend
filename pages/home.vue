<template>
  <main class="min-h-screen bg-[#f7f6f3] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
    <section class="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
      <div class="w-full max-w-2xl rounded-2xl border border-[#e5e2dc] bg-white p-6 shadow-[0_24px_70px_rgba(31,41,55,0.10)] sm:p-8">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-sm font-medium text-blue-600">
              Попутно
            </p>

            <h1 class="mt-3 text-3xl font-semibold text-slate-950">
              Добро пожаловать, {{ user?.name || 'путешественник' }}
            </h1>

            <p class="mt-3 text-sm leading-6 text-slate-500">
              Профиль загружен через cookie-сессию. Здесь позже появится рабочая область планирования.
            </p>
          </div>

          <button
            type="button"
            class="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isLoading"
            @click="handleLogout"
          >
            {{ isLoading ? 'Выходим...' : 'Выйти' }}
          </button>
        </div>

        <dl class="mt-8 grid gap-4 sm:grid-cols-2">
          <div class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <dt class="text-xs font-medium uppercase text-slate-400">
              Email
            </dt>
            <dd class="mt-1 text-sm font-medium text-slate-800">
              {{ user?.email || '—' }}
            </dd>
          </div>

          <div class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <dt class="text-xs font-medium uppercase text-slate-400">
              UUID
            </dt>
            <dd class="mt-1 break-all text-sm font-medium text-slate-800">
              {{ user?.uuid || '—' }}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const { isLoading, user } = storeToRefs(authStore);

useHead({
  title: 'Главная',
});

const handleLogout = async () => {
  await authStore.logout();
  await navigateTo('/auth');
};
</script>
