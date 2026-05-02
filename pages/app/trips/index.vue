<template>
  <section class="space-y-8">
    <div class="flex flex-col gap-5 border-b border-slate-200/80 pb-8 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-2xl">
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
          Попутно
        </p>

        <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Мои поездки
        </h1>

        <p class="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
          Создавайте маршруты, добавляйте места и планируйте каждый день поездки.
        </p>
      </div>

      <NuxtLink
        to="/app/trips/create"
        class="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Создать поездку
      </NuxtLink>
    </div>

    <div
      v-if="error"
      class="flex flex-col gap-4 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <div class="flex items-start gap-3">
        <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 5.333v3.334" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
            <path d="M8 10.667h.007" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
            <path d="M6.853 2.58 1.907 11.06a1.333 1.333 0 0 0 1.147 2h9.892a1.333 1.333 0 0 0 1.147-2L9.147 2.58a1.333 1.333 0 0 0-2.294 0Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.25" />
          </svg>
        </span>

        <p class="leading-6">
          {{ error }}
        </p>
      </div>

      <button
        type="button"
        class="inline-flex h-10 items-center justify-center rounded-2xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
        :disabled="isLoading"
        @click="reloadTrips"
      >
        {{ isLoading ? 'Обновляем...' : 'Повторить' }}
      </button>
    </div>

    <div v-if="showInitialSkeleton" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="placeholder in 6"
        :key="placeholder"
        class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(37,99,235,0.06)]"
      >
        <div class="animate-pulse">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="h-6 w-2/3 rounded-full bg-slate-200" />
              <div class="mt-3 h-4 w-1/3 rounded-full bg-slate-100" />
            </div>
            <div class="h-8 w-20 rounded-full bg-blue-100" />
          </div>

          <div class="mt-8 grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <div class="h-3 w-12 rounded-full bg-slate-100" />
              <div class="h-4 w-full rounded-full bg-slate-200" />
            </div>
            <div class="space-y-2">
              <div class="h-3 w-16 rounded-full bg-slate-100" />
              <div class="h-4 w-3/4 rounded-full bg-slate-200" />
            </div>
          </div>

          <div class="mt-8 flex justify-between gap-3">
            <div class="h-10 w-24 rounded-2xl bg-slate-100" />
            <div class="h-10 w-28 rounded-2xl bg-blue-100" />
          </div>
        </div>
      </article>
    </div>

    <div
      v-else-if="showEmptyState"
      class="rounded-[32px] border border-dashed border-blue-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 px-6 py-10 text-center shadow-[0_24px_60px_rgba(37,99,235,0.08)] sm:px-10 sm:py-14"
    >
      <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white shadow-[0_14px_35px_rgba(37,99,235,0.12)]">
        <svg class="h-10 w-10 text-blue-600" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path d="M10 34.5h28" stroke="currentColor" stroke-linecap="round" stroke-width="2.4" />
          <path d="M14 31V15.5a2.5 2.5 0 0 1 2.5-2.5h15.879a2.5 2.5 0 0 1 1.768.732l3.121 3.121A2.5 2.5 0 0 1 38 18.621V31" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" />
          <path d="M18 20h12M18 25h8" stroke="currentColor" stroke-linecap="round" stroke-width="2.4" />
        </svg>
      </div>

      <h2 class="mt-6 text-2xl font-semibold text-slate-950">
        Пока нет поездок
      </h2>

      <p class="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
        Создайте первую поездку и начните собирать маршрут.
      </p>

      <NuxtLink
        to="/app/trips/create"
        class="mt-8 inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Создать поездку
      </NuxtLink>
    </div>

    <div
      v-else-if="showErrorState"
      class="rounded-[32px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center sm:px-10 sm:py-14"
    >
      <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white text-slate-400 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
        <svg class="h-10 w-10" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path d="M24 14v12" stroke="currentColor" stroke-linecap="round" stroke-width="2.4" />
          <path d="M24 31h.01" stroke="currentColor" stroke-linecap="round" stroke-width="2.4" />
          <circle cx="24" cy="24" r="16" stroke="currentColor" stroke-width="2.4" />
        </svg>
      </div>

      <h2 class="mt-6 text-2xl font-semibold text-slate-950">
        Не удалось загрузить поездки
      </h2>

      <p class="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
        Попробуйте обновить список еще раз. Если проблема повторится, сессия могла завершиться или сервер временно недоступен.
      </p>

      <button
        type="button"
        class="mt-8 inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
        :disabled="isLoading"
        @click="reloadTrips"
      >
        {{ isLoading ? 'Обновляем...' : 'Повторить загрузку' }}
      </button>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="trip in trips"
        :key="trip.uuid"
        class="group flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_28px_75px_rgba(37,99,235,0.12)]"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <NuxtLink
              :to="`/app/trips/${trip.uuid}`"
              class="block break-words text-xl font-semibold text-slate-950 transition group-hover:text-blue-700"
            >
              {{ trip.title }}
            </NuxtLink>

            <p class="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
              <span class="h-2 w-2 rounded-full bg-blue-500" />
              {{ trip.city }}
            </p>
          </div>

          <span class="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {{ formatPlacesCount(trip.places_count) }}
          </span>
        </div>

        <dl class="mt-8 grid gap-4 text-sm text-slate-600">
          <div class="rounded-2xl bg-slate-50 px-4 py-3">
            <dt class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Даты
            </dt>
            <dd class="mt-1 text-sm font-medium text-slate-900">
              {{ formatDateRange(trip.date_from, trip.date_to) }}
            </dd>
          </div>

          <div class="flex gap-4">
            <div class="min-w-0 flex-1 rounded-2xl bg-slate-50 px-4 py-3">
              <dt class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Создана
              </dt>
              <dd class="mt-1 truncate text-sm font-medium text-slate-900">
                {{ formatDate(trip.created_at) }}
              </dd>
            </div>

            <div class="min-w-0 flex-1 rounded-2xl bg-slate-50 px-4 py-3">
              <dt class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Маршрут
              </dt>
              <dd class="mt-1 text-sm font-medium text-slate-900">
                {{ trip.city }}
              </dd>
            </div>
          </div>
        </dl>

        <div class="mt-8 flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="Boolean(deletingTripId)"
            @click="handleDelete(trip.uuid, trip.title)"
          >
            {{ deletingTripId === trip.uuid ? 'Удаляем...' : 'Удалить' }}
          </button>

          <NuxtLink
            :to="`/app/trips/${trip.uuid}`"
            class="inline-flex h-10 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Открыть
          </NuxtLink>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useTripsStore } from '~/stores/trips';

definePageMeta({
  layout: 'app',
});

const tripsStore = useTripsStore();
const { error, isLoading, trips } = storeToRefs(tripsStore);

const hasLoadedOnce = ref(false);
const deletingTripId = ref<string | null>(null);

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const showInitialSkeleton = computed(() => isLoading.value && !hasLoadedOnce.value);
const showEmptyState = computed(() => !showInitialSkeleton.value && !error.value && trips.value.length === 0);
const showErrorState = computed(() => !showInitialSkeleton.value && Boolean(error.value) && trips.value.length === 0);

const formatDate = (value: string) => {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
};

const formatDateRange = (dateFrom: string, dateTo: string) => {
  const formattedFrom = formatDate(dateFrom);
  const formattedTo = formatDate(dateTo);

  return `${formattedFrom} - ${formattedTo}`;
};

const formatPlacesCount = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} место`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} места`;
  }

  return `${count} мест`;
};

const loadTrips = async () => {
  try {
    await tripsStore.fetchTrips({
      limit: 10,
      offset: 0,
    });
  } finally {
    hasLoadedOnce.value = true;
  }
};

const reloadTrips = async () => {
  await loadTrips();
};

const handleDelete = async (tripUuid: string, tripTitle: string) => {
  if (deletingTripId.value) {
    return;
  }

  if (!window.confirm(`Удалить поездку "${tripTitle}"?`)) {
    return;
  }

  deletingTripId.value = tripUuid;

  try {
    await tripsStore.deleteTrip(tripUuid);
  } finally {
    deletingTripId.value = null;
  }
};

useSeoMeta({
  title: 'Мои поездки — Попутно',
  description: 'Список ваших поездок и маршрутов в приложении Попутно.',
});

if (import.meta.client) {
  await loadTrips();
}
</script>
