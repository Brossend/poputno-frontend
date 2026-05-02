<template>
  <header class="rounded-[30px] border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-slate-50 px-5 py-5 shadow-[0_18px_50px_rgba(37,99,235,0.08)] sm:px-6">
    <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0">
        <NuxtLink
          to="/app/trips"
          class="inline-flex items-center gap-2 text-sm font-medium text-blue-700 transition hover:text-blue-800"
        >
          <svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3.5 5.5 8 10 12.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
          </svg>
          К моим поездкам
        </NuxtLink>

        <p class="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
          Попутно
        </p>

        <h1 class="mt-3 break-words text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {{ trip?.title || 'Поездка' }}
        </h1>

        <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
          {{ summaryText }}
        </p>
      </div>

      <div class="w-full lg:min-w-[420px] lg:max-w-[560px]">
        <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            :disabled="!canOpenSettings"
            @click="emit('open-settings')"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M11.6 2.7a1 1 0 0 0-1.2-.68l-1.1.33a1 1 0 0 1-1.04-.27l-.78-.84a1 1 0 0 0-1.35-.1L4.8 2.1a1 1 0 0 0-.25 1.32l.56.99a1 1 0 0 1-.06 1.08l-.68.92a1 1 0 0 1-.99.38l-1.11-.18a1 1 0 0 0-1.12.76l-.37 1.62a1 1 0 0 0 .56 1.12l1.03.46a1 1 0 0 1 .58.91v1.12a1 1 0 0 1-.58.91l-1.03.46a1 1 0 0 0-.56 1.12l.37 1.62a1 1 0 0 0 1.12.76l1.11-.18a1 1 0 0 1 .99.38l.68.92a1 1 0 0 1 .06 1.08l-.56.99a1 1 0 0 0 .25 1.32l1.31.98a1 1 0 0 0 1.35-.1l.78-.84a1 1 0 0 1 1.04-.27l1.1.33a1 1 0 0 0 1.2-.68l.39-1.07a1 1 0 0 1 .85-.64l1.14-.09a1 1 0 0 0 .93-.98v-1.64a1 1 0 0 1 .49-.86l.98-.57a1 1 0 0 0 .39-1.3l-.75-1.48a1 1 0 0 1 0-.9l.75-1.48a1 1 0 0 0-.39-1.3l-.98-.57a1 1 0 0 1-.49-.86V6.7a1 1 0 0 0-.93-.98l-1.14-.09a1 1 0 0 1-.85-.64l-.39-1.07Z" stroke="currentColor" stroke-linejoin="round" stroke-width="1.2" />
              <path d="M10 12.85a2.85 2.85 0 1 0 0-5.7 2.85 2.85 0 0 0 0 5.7Z" stroke="currentColor" stroke-width="1.2" />
            </svg>
            Настройки поездки
          </button>

          <button
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            :disabled="!canShareTrip || isSharingTrip"
            @click="emit('share-trip')"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M13.75 6.25a2.5 2.5 0 1 0-2.37-3.3l-4.56 2.28a2.5 2.5 0 1 0 0 4.54l4.56 2.28a2.5 2.5 0 1 0 .64-1.28l-4.56-2.28a2.5 2.5 0 0 0 0-1.98l4.56-2.28c.44.47 1.06.77 1.73.77Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3" />
            </svg>
            {{ isSharingTrip ? 'Готовим ссылку...' : 'Поделиться' }}
          </button>

          <button
            type="button"
            class="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
            :disabled="!canBuildRoute || isBuildingRoute"
            @click="emit('build-route')"
          >
            {{ isBuildingRoute ? 'Строим...' : 'Построить маршрут' }}
          </button>
        </div>

        <p v-if="!canBuildRoute" class="mt-3 max-w-sm text-sm leading-6 text-slate-500 sm:ml-auto sm:text-right">
          Добавьте минимум два места, чтобы построить маршрут.
        </p>

        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <div class="rounded-2xl border border-white/80 bg-white/90 px-4 py-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Город
            </p>
            <p class="mt-1 text-sm font-semibold text-slate-900">
              {{ trip?.city || 'Не указан' }}
            </p>
          </div>

          <div class="rounded-2xl border border-white/80 bg-white/90 px-4 py-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Даты
            </p>
            <p class="mt-1 text-sm font-semibold text-slate-900">
              {{ dateRangeLabel }}
            </p>
          </div>

          <div class="rounded-2xl border border-white/80 bg-white/90 px-4 py-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Места
            </p>
            <p class="mt-1 text-sm font-semibold text-slate-900">
              {{ placesLabel }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Trip } from '~/types/trip';

interface Props {
  trip: Trip | null;
  placesCount: number;
  daysCount: number;
  canBuildRoute: boolean;
  isBuildingRoute: boolean;
  canOpenSettings: boolean;
  canShareTrip: boolean;
  isSharingTrip: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (event: 'build-route'): void;
  (event: 'open-settings'): void;
  (event: 'share-trip'): void;
}>();

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
});

const formatDate = (value?: string) => {
  if (!value) {
    return 'Не указаны';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
};

const dateRangeLabel = computed(() => {
  if (!props.trip?.date_from || !props.trip?.date_to) {
    return 'Пока нет дат';
  }

  return `${formatDate(props.trip.date_from)} - ${formatDate(props.trip.date_to)}`;
});

const placesLabel = computed(() => {
  const count = props.placesCount;
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} место`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} места`;
  }

  return `${count} мест`;
});

const dayLabel = computed(() => {
  const mod10 = props.daysCount % 10;
  const mod100 = props.daysCount % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return 'день';
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'дня';
  }

  return 'дней';
});

const summaryText = computed(() => {
  if (!props.trip) {
    return 'Маршрут уже готов к работе: слева список дней и мест, справа карта OpenStreetMap. Когда ответ поездки станет полным, экран автоматически подхватит все детали.';
  }

  return `Планируйте маршрут по дням, просматривайте места на карте OpenStreetMap и держите всю поездку в одном рабочем пространстве. Сейчас в поездке ${placesLabel.value} на ${props.daysCount} ${dayLabel.value}.`;
});
</script>
