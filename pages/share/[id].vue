<template>
  <section class="min-h-screen bg-[#f6f1e8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-6xl">
      <div
        v-if="fallbackTrip"
        class="rounded-[32px] border border-[#e5ddd2] bg-white/90 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.09)] backdrop-blur sm:p-8"
      >
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Попутно
            </p>

            <h1 class="mt-4 break-words text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {{ fallbackTrip.title }}
            </h1>

            <p class="mt-4 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              {{ fallbackDescription }}
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <NuxtLink
              to="/auth"
              class="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Войти
            </NuxtLink>

            <NuxtLink
              to="/app/trips"
              class="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Мои поездки
            </NuxtLink>
          </div>
        </div>

        <div class="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Город
            </p>
            <p class="mt-1 text-sm font-semibold text-slate-900">
              {{ fallbackTrip.city || 'Не указан' }}
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Даты
            </p>
            <p class="mt-1 text-sm font-semibold text-slate-900">
              {{ fallbackDateRangeLabel }}
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Места
            </p>
            <p class="mt-1 text-sm font-semibold text-slate-900">
              {{ fallbackPlacesLabel }}
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Маршрут
            </p>
            <p class="mt-1 text-sm font-semibold text-slate-900">
              {{ fallbackRouteSummary.durationLabel }}
            </p>
          </div>
        </div>

        <div class="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <TripMap
            class="h-[460px] xl:h-[min(72vh,56rem)]"
            :center="fallbackMapCenter"
            :city-name="fallbackTrip.city"
            :has-explicit-center="fallbackHasExplicitCenter"
            :places="fallbackPlaces"
            :selected-place-id="fallbackSelectedPlaceId"
            :route-segments="fallbackRouteSegments"
            @select-place="fallbackSelectedPlaceId = $event"
          />

          <div class="space-y-4">
            <div class="rounded-[26px] border border-blue-100 bg-blue-50/80 px-5 py-5 shadow-[0_16px_40px_rgba(37,99,235,0.08)]">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                Сводка маршрута
              </p>

              <div class="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div class="rounded-2xl border border-white/90 bg-white/90 px-4 py-3">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Дни
                  </p>
                  <p class="mt-1 text-sm font-semibold text-slate-900">
                    {{ fallbackRouteSummary.daysLabel }}
                  </p>
                </div>

                <div class="rounded-2xl border border-white/90 bg-white/90 px-4 py-3">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Расстояние
                  </p>
                  <p class="mt-1 text-sm font-semibold text-slate-900">
                    {{ fallbackRouteSummary.distanceLabel }}
                  </p>
                </div>

                <div class="rounded-2xl border border-white/90 bg-white/90 px-4 py-3">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Время
                  </p>
                  <p class="mt-1 text-sm font-semibold text-slate-900">
                    {{ fallbackRouteSummary.durationLabel }}
                  </p>
                </div>
              </div>
            </div>

            <section
              v-for="group in fallbackDayGroups"
              :key="group.day"
              class="rounded-[26px] border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h2 class="text-base font-semibold text-slate-950">
                    День {{ group.day }}
                  </h2>
                  <p class="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {{ formatPlacesCount(group.places.length) }}
                  </p>
                </div>

                <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {{ formatDayDuration(group.places) }}
                </span>
              </div>

              <div class="mt-4 space-y-3">
                <article
                  v-for="(place, index) in group.places"
                  :key="place.uuid"
                  class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0 flex-1">
                      <p class="break-words text-sm font-semibold text-slate-950">
                        {{ place.name }}
                      </p>

                      <p class="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-600">
                        {{ index + 1 }} · {{ fallbackCategoryLabels[place.category] }}
                      </p>
                    </div>

                    <span class="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                      {{ formatDuration(place.duration_minutes) }}
                    </span>
                  </div>

                  <p v-if="place.address" class="mt-3 break-words text-sm leading-5 text-slate-500">
                    {{ place.address }}
                  </p>
                </article>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div
        v-else
        class="rounded-[32px] border border-[#e5ddd2] bg-white/90 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.09)] backdrop-blur sm:p-8"
      >
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
import TripMap from '~/components/map/TripMap.vue';
import { useAuthStore } from '~/stores/auth';
import { useTripsStore } from '~/stores/trips';
import type { Place, PlaceCategory } from '~/types/place';
import type { RouteBuildResponse, RouteMapSegment } from '~/types/route';
import {
  decryptFallbackShareSnapshot,
  hasEncryptedFallbackShareHash,
  materializeFallbackShareSnapshot,
} from '~/utils/fallbackShare';

const route = useRoute();
const authStore = useAuthStore();
const tripsStore = useTripsStore();

const { error: tripsError, isSharing } = storeToRefs(tripsStore);

const shareError = ref<string | null>(null);
const hasTriedToOpen = ref(false);
const hasFallbackHash = ref(false);
const fallbackSelectedPlaceId = ref<string | null>(null);
const fallbackTrip = ref<ReturnType<typeof materializeFallbackShareSnapshot>['trip'] | null>(null);
const fallbackPlaces = ref<Place[]>([]);
const fallbackRoute = ref<RouteBuildResponse | null>(null);

const MOSCOW_COORDS = {
  lat: 55.7558,
  lng: 37.6173,
};

const fallbackCategoryLabels: Record<PlaceCategory, string> = {
  attraction: 'Достопримечательность',
  museum: 'Музей',
  cafe: 'Кафе',
  restaurant: 'Ресторан',
  park: 'Парк',
  viewpoint: 'Смотровая',
  shopping: 'Шопинг',
  other: 'Другое',
};

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
    return 'Мы попробовали запросить поездку по share-ссылке. Ниже показали ответ, который пришёл с backend или при расшифровке fallback-ссылки.';
  }

  return 'Эта страница нужна, чтобы добавить поездку в ваш аккаунт по приглашению.';
});

const showRetry = computed(() => hasTriedToOpen.value && !isSharing.value && !hasFallbackHash.value);

const fallbackDescription = computed(() => {
  if (!fallbackTrip.value) {
    return '';
  }

  if (fallbackRoute.value?.mode === 'walking') {
    return 'Маршрут открыт по защищённой fallback-ссылке. Все точки и пешая геометрия восстановлены прямо из адреса, без запроса к backend.';
  }

  if (fallbackRoute.value?.mode === 'driving') {
    return 'Маршрут открыт по защищённой fallback-ссылке. Все точки и автомобильная геометрия восстановлены прямо из адреса, без запроса к backend.';
  }

  return 'Маршрут открыт по защищённой fallback-ссылке. Поездка, точки и доступная геометрия восстановлены прямо из адреса, без запроса к backend.';
});

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

const formatDuration = (minutes?: number | null) => {
  if (typeof minutes !== 'number') {
    return 'Пока нет данных';
  }

  if (minutes < 60) {
    return `${minutes} мин`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes ? `${hours} ч ${remainingMinutes} мин` : `${hours} ч`;
};

const formatDistance = (value?: number | null) => (
  typeof value === 'number'
    ? `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: value >= 10 ? 0 : 1 }).format(value)} км`
    : 'Пока нет данных'
);

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

const formatDayDuration = (places: Place[]) => {
  const totalMinutes = places.reduce((sum, place) => sum + place.duration_minutes, 0);

  return totalMinutes ? formatDuration(totalMinutes) : 'Без тайминга';
};

const fallbackDateRangeLabel = computed(() => (
  fallbackTrip.value
    ? `${formatDate(fallbackTrip.value.date_from)} - ${formatDate(fallbackTrip.value.date_to)}`
    : 'Пока нет дат'
));

const fallbackPlacesLabel = computed(() => formatPlacesCount(fallbackPlaces.value.length));

const fallbackMapCenter = computed(() => {
  if (typeof fallbackTrip.value?.city_lat === 'number' && typeof fallbackTrip.value.city_lng === 'number') {
    return {
      lat: fallbackTrip.value.city_lat,
      lng: fallbackTrip.value.city_lng,
    };
  }

  const firstPlace = fallbackPlaces.value[0];

  if (firstPlace) {
    return {
      lat: firstPlace.lat,
      lng: firstPlace.lng,
    };
  }

  return MOSCOW_COORDS;
});

const fallbackHasExplicitCenter = computed(() => (
  typeof fallbackTrip.value?.city_lat === 'number' && typeof fallbackTrip.value?.city_lng === 'number'
));

const fallbackDayGroups = computed(() => {
  const groupedPlaces = new Map<number, Place[]>();

  for (const place of [...fallbackPlaces.value].sort((left, right) => {
    if (left.day !== right.day) {
      return left.day - right.day;
    }

    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.name.localeCompare(right.name, 'ru');
  })) {
    const currentPlaces = groupedPlaces.get(place.day) ?? [];
    currentPlaces.push(place);
    groupedPlaces.set(place.day, currentPlaces);
  }

  return Array.from(groupedPlaces.entries())
    .sort(([leftDay], [rightDay]) => leftDay - rightDay)
    .map(([day, places]) => ({ day, places }));
});

const fallbackSegments = computed<RouteMapSegment[]>(() => fallbackDayGroups.value
  .filter((group) => group.places.length >= 2)
  .map((group) => ({
    day: group.day,
    latLngs: group.places.map((place) => [place.lat, place.lng] as [number, number]),
    isFallback: true,
  })));

const fallbackSegmentMap = computed(() => new Map(
  fallbackSegments.value.map((segment) => [segment.day, segment]),
));

const fallbackRouteSegments = computed<RouteMapSegment[]>(() => {
  const routeDays = [...(fallbackRoute.value?.days ?? [])].sort((left, right) => left.day - right.day);

  if (!routeDays.length) {
    return fallbackSegments.value;
  }

  const segments: RouteMapSegment[] = [];

  for (const routeDay of routeDays) {
    const latLngs = (routeDay.geometry?.coordinates ?? [])
      .filter((coordinate): coordinate is [number, number] => (
        Array.isArray(coordinate)
        && coordinate.length >= 2
        && typeof coordinate[0] === 'number'
        && typeof coordinate[1] === 'number'
      ))
      .map(([lng, lat]) => [lat, lng] as [number, number]);

    if (latLngs.length >= 2) {
      segments.push({
        day: routeDay.day,
        latLngs,
        distance_km: routeDay.distance_km,
        duration_minutes: routeDay.duration_minutes,
      });
      continue;
    }

    const fallbackSegment = fallbackSegmentMap.value.get(routeDay.day);

    if (fallbackSegment) {
      segments.push({
        ...fallbackSegment,
        distance_km: routeDay.distance_km,
        duration_minutes: routeDay.duration_minutes,
      });
    }
  }

  return segments.length ? segments : fallbackSegments.value;
});

const fallbackRouteSummary = computed(() => {
  const routeDays = fallbackRoute.value?.days ?? [];
  const daysCount = routeDays.length || fallbackDayGroups.value.length || null;

  const distanceValues = routeDays
    .map((routeDay) => routeDay.distance_km)
    .filter((value): value is number => typeof value === 'number');

  const durationValues = routeDays
    .map((routeDay) => routeDay.duration_minutes)
    .filter((value): value is number => typeof value === 'number');

  const distanceKm = distanceValues.length
    ? distanceValues.reduce((total, value) => total + value, 0)
    : null;

  const durationMinutes = durationValues.length
    ? durationValues.reduce((total, value) => total + value, 0)
    : null;

  return {
    daysLabel: daysCount ? `${daysCount}` : 'Пока нет данных',
    distanceLabel: formatDistance(distanceKm),
    durationLabel: formatDuration(durationMinutes),
  };
});

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

const openFallbackShare = async () => {
  if (!import.meta.client || !hasEncryptedFallbackShareHash(window.location.hash)) {
    return false;
  }

  hasFallbackHash.value = true;
  hasTriedToOpen.value = true;
  shareError.value = null;

  try {
    const snapshot = await decryptFallbackShareSnapshot(window.location.hash);

    if (!snapshot) {
      shareError.value = 'Не удалось прочитать защищённую fallback-ссылку.';
      return true;
    }

    const materializedShare = materializeFallbackShareSnapshot(snapshot);
    fallbackTrip.value = materializedShare.trip;
    fallbackPlaces.value = materializedShare.places;
    fallbackRoute.value = materializedShare.route;

    if (materializedShare.places[0]) {
      fallbackSelectedPlaceId.value = materializedShare.places[0].uuid;
    }
  } catch {
    shareError.value = 'Не удалось расшифровать fallback-ссылку. Проверьте, что ссылка скопирована полностью.';
  }

  return true;
};

useSeoMeta({
  title: () => fallbackTrip.value
    ? `${fallbackTrip.value.title} — Попутно`
    : 'Открыть поездку — Попутно',
  description: () => fallbackTrip.value
    ? 'Защищённое fallback-превью поездки и маршрута в Попутно.'
    : 'Добавление поездки в аккаунт по приглашению в Попутно.',
});

if (import.meta.client) {
  const openedFallbackShare = await openFallbackShare();

  if (!openedFallbackShare) {
    await handleOpenShare();
  }
}
</script>
