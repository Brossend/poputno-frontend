<template>
  <section class="min-h-screen bg-[#f6f1e8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-2xl">
      <div class="rounded-[32px] border border-[#e5ddd2] bg-white/90 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.09)] backdrop-blur sm:p-8">
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
          Попутно
        </p>

        <h1 class="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {{ heading }}
        </h1>

        <p class="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
          {{ description }}
        </p>

        <div v-if="shareError" class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-900">
          {{ shareError }}
        </div>

        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            v-if="showRetry"
            type="button"
            class="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            @click="handleOpenShare"
          >
            Попробовать снова
          </button>

          <NuxtLink
            to="/app/trips"
            class="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Перейти к поездкам
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/stores/auth';
import { useTripsStore } from '~/stores/trips';

const route = useRoute();
const authStore = useAuthStore();
const tripsStore = useTripsStore();

const { error: tripsError, isSharing } = storeToRefs(tripsStore);

const shareError = ref<string | null>(null);
const hasTriedToOpen = ref(false);

const tripId = computed(() => {
  const rawId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;

  return typeof rawId === 'string' ? rawId : '';
});

const heading = computed(() => {
  if (isSharing.value) {
    return 'Открываем поездку';
  }

  if (shareError.value) {
    return 'Не удалось открыть поездку';
  }

  return 'Приглашение в поездку';
});

const description = computed(() => {
  if (!tripId.value) {
    return 'В ссылке не хватает идентификатора поездки. Проверьте адрес и попробуйте снова.';
  }

  if (isSharing.value) {
    return 'Проверяем сессию и запрашиваем копию поездки для вашего аккаунта.';
  }

  if (shareError.value) {
    return 'Мы попробовали запросить поездку по share-ссылке. Ниже показали ответ, который пришёл с backend.';
  }

  return 'Эта страница нужна, чтобы добавить поездку в ваш аккаунт по приглашению.';
});

const showRetry = computed(() => hasTriedToOpen.value && !isSharing.value);

const handleOpenShare = async () => {
  hasTriedToOpen.value = true;
  shareError.value = null;
  tripsStore.clearError();

  if (!tripId.value) {
    shareError.value = 'В ссылке нет trip_id.';
    return;
  }

  if (!authStore.isInitialized) {
    await authStore.initialize();
  }

  if (!authStore.user) {
    await navigateTo({
      path: '/auth',
      query: {
        redirect: route.fullPath,
      },
    }, { replace: true });
    return;
  }

  const shareResult = await tripsStore.shareTrip(tripId.value);

  if (!shareResult) {
    shareError.value = tripsError.value || 'Не удалось открыть поездку по ссылке.';
    return;
  }

  if (shareResult.uuid) {
    await navigateTo(`/app/trips/${shareResult.uuid}`, { replace: true });
    return;
  }

  shareError.value = 'Сервер ответил без UUID новой поездки. Когда backend начнет отдавать контракт share/import, экран автоматически сможет завершать переход.';
};

useSeoMeta({
  title: 'Открыть поездку — Попутно',
  description: 'Добавление поездки в аккаунт по приглашению в Попутно.',
});

if (import.meta.client) {
  await handleOpenShare();
}
</script>
