<template>
  <section class="space-y-6">
    <TripEditorHeader
      :trip="currentTrip"
      :places-count="places.length"
      :days-count="resolvedDaysCount"
      :can-build-route="canBuildRoute"
      :is-building-route="isBuildingRoute"
      :can-open-settings="canOpenTripSettings"
      :can-share-trip="canShareTrip"
      :is-sharing-trip="isSharingTrip"
      @build-route="handleBuildRoute"
      @open-settings="openTripSettings"
      @share-trip="handleShareTrip"
    />

    <TripSettingsModal
      v-model="isTripSettingsOpen"
      :trip="currentTrip"
      :is-saving="isSavingTripSettings"
      :submit-error="tripSettingsSubmitError"
      @submit="handleTripSettingsSubmit"
    />

    <div
      v-if="shareError"
      class="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-6 text-rose-900"
    >
      {{ shareError }}
    </div>

    <div
      v-else-if="shareLink"
      class="rounded-[28px] border border-blue-100 bg-blue-50/80 px-5 py-5 shadow-[0_16px_40px_rgba(37,99,235,0.08)]"
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Ссылка на поездку
          </p>

          <p class="mt-2 text-sm leading-6 text-slate-600">
            {{ shareMessage || 'Ссылка готова. Можно отправить её другому пользователю.' }}
          </p>
        </div>

        <button
          type="button"
          class="inline-flex h-11 items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:text-blue-800"
          @click="copyShareLink"
        >
          Скопировать ссылку
        </button>
      </div>

      <div class="mt-4 rounded-2xl border border-white/90 bg-white/90 px-4 py-3 text-sm text-slate-700">
        <span class="block break-all">{{ shareLink }}</span>
      </div>
    </div>

    <div
      v-if="tripInfoMessage"
      class="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900"
    >
      {{ tripInfoMessage }}
    </div>

    <div
      v-if="routeError"
      class="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-6 text-rose-900"
    >
      {{ routeError }}
    </div>

    <div
      v-else-if="!canBuildRoute"
      class="rounded-[28px] border border-blue-100 bg-blue-50/80 px-5 py-4 text-sm leading-6 text-blue-900"
    >
      Добавьте минимум два места, чтобы построить маршрут.
    </div>

    <div
      v-else-if="routeWarningMessage"
      class="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900"
    >
      {{ routeWarningMessage }}
    </div>

    <div
      v-if="routeSummary"
      class="rounded-[28px] border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 px-5 py-5 shadow-[0_18px_45px_rgba(37,99,235,0.08)]"
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Маршрут готов
          </p>
          <p class="mt-2 text-sm leading-6 text-slate-600">
            {{ routeSummaryDescription }}
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-2xl border border-white/80 bg-white/90 px-4 py-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Дни
            </p>
            <p class="mt-1 text-sm font-semibold text-slate-900">
              {{ routeSummary.daysLabel }}
            </p>
          </div>

          <div class="rounded-2xl border border-white/80 bg-white/90 px-4 py-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Расстояние
            </p>
            <p class="mt-1 text-sm font-semibold text-slate-900">
              {{ routeSummary.distanceLabel }}
            </p>
          </div>

          <div class="rounded-2xl border border-white/80 bg-white/90 px-4 py-3">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Время
            </p>
            <p class="mt-1 text-sm font-semibold text-slate-900">
              {{ routeSummary.durationLabel }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 lg:hidden">
      <button
        type="button"
        class="inline-flex h-10 flex-1 items-center justify-center rounded-2xl text-sm font-semibold transition"
        :class="mobileView === 'map' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'"
        @click="mobileView = 'map'"
      >
        Карта
      </button>

      <button
        type="button"
        class="inline-flex h-10 flex-1 items-center justify-center rounded-2xl text-sm font-semibold transition"
        :class="mobileView === 'days' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'"
        @click="mobileView = 'days'"
      >
        Дни
      </button>
    </div>

    <div class="grid gap-4 lg:min-h-[calc(100vh-15rem)] lg:grid-cols-[minmax(380px,420px)_minmax(0,1fr)]">
      <TripDaysSidebar
        class="order-2 lg:order-1"
        :class="mobileView === 'days' ? 'block' : 'hidden lg:flex'"
        :day-groups="dayGroups"
        :total-days="resolvedDaysCount"
        :selected-place-id="selectedPlaceId"
        :is-loading="placesLoading"
        :is-mutating="isMutatingPlaces"
        :error="placesError"
        @select-place="handleSelectPlace"
        @delete-place="handleDeletePlace"
        @move-place="handleMovePlace"
      />

      <div
        class="order-1 lg:order-2"
        :class="mobileView === 'map' ? 'block' : 'hidden lg:block'"
      >
        <div class="flex h-full flex-col gap-4">
          <TripMap
            class="h-[480px] lg:h-[min(70vh,52rem)]"
            :center="mapCenter"
            :places="places"
            :selected-place-id="selectedPlaceId"
            :route-segments="routeSegments"
            @select-place="handleSelectPlace"
          />

          <PlaceSearchPanel
            :trip-id="tripId"
            :trip-city="currentTrip?.city"
            :center="searchCenter"
            :total-days="resolvedDaysCount"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import PlaceSearchPanel from '~/components/map/PlaceSearchPanel.vue';
import TripMap from '~/components/map/TripMap.vue';
import TripDaysSidebar from '~/components/trips/TripDaysSidebar.vue';
import TripEditorHeader from '~/components/trips/TripEditorHeader.vue';
import TripSettingsModal from '~/components/trips/TripSettingsModal.vue';
import { usePlacesStore } from '~/stores/places';
import { useRouteStore } from '~/stores/route';
import { useTripsStore } from '~/stores/trips';
import type { RouteMapSegment } from '~/types/route';
import type { TripShareResult, UpdateTripPayload } from '~/types/trip';

definePageMeta({
  layout: 'app',
});

const MOSCOW_COORDS = {
  lat: 55.7558,
  lng: 37.6173,
};

const route = useRoute();
const tripsStore = useTripsStore();
const placesStore = usePlacesStore();
const routeStore = useRouteStore();

const { currentTrip, error: tripError, isSharing: isSharingTrip } = storeToRefs(tripsStore);
const {
  error: placesError,
  isLoading: placesLoading,
  isDeleting: isDeletingPlace,
  places,
  placesByDay,
  selectedPlaceId,
  isUpdating: isUpdatingPlace,
} = storeToRefs(placesStore);
const {
  error: routeError,
  isBuilding: isBuildingRoute,
  route: builtRoute,
} = storeToRefs(routeStore);

const mobileView = ref<'map' | 'days'>('map');
const isTripSettingsOpen = ref(false);
const isSavingTripSettings = ref(false);
const tripSettingsSubmitError = ref<string | null>(null);
const shareLink = ref<string | null>(null);
const shareMessage = ref<string | null>(null);
const shareError = ref<string | null>(null);

const tripId = computed(() => {
  const rawId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;

  return typeof rawId === 'string' ? rawId : '';
});

const parseDateString = (value?: string) => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
};

const resolvedDaysCount = computed(() => {
  if (typeof currentTrip.value?.days_count === 'number' && currentTrip.value.days_count > 0) {
    return currentTrip.value.days_count;
  }

  const dateFrom = parseDateString(currentTrip.value?.date_from);
  const dateTo = parseDateString(currentTrip.value?.date_to);

  if (dateFrom && dateTo && dateTo >= dateFrom) {
    return Math.floor((dateTo.getTime() - dateFrom.getTime()) / 86400000) + 1;
  }

  const maxPlaceDay = places.value.reduce((maxDay, place) => Math.max(maxDay, place.day), 1);

  return Math.max(maxPlaceDay, 1);
});

const dayGroups = computed(() => placesByDay.value);
const canBuildRoute = computed(() => Boolean(tripId.value) && places.value.length >= 2);
const canOpenTripSettings = computed(() => Boolean(tripId.value && currentTrip.value));
const canShareTrip = computed(() => Boolean(tripId.value));
const isMutatingPlaces = computed(() => isDeletingPlace.value || isUpdatingPlace.value);

const mapCenter = computed(() => ({
  lat: typeof currentTrip.value?.city_lat === 'number' ? currentTrip.value.city_lat : MOSCOW_COORDS.lat,
  lng: typeof currentTrip.value?.city_lng === 'number' ? currentTrip.value.city_lng : MOSCOW_COORDS.lng,
}));

const searchCenter = computed(() => (
  typeof currentTrip.value?.city_lat === 'number' && typeof currentTrip.value?.city_lng === 'number'
    ? {
      lat: currentTrip.value.city_lat,
      lng: currentTrip.value.city_lng,
    }
    : null
));

const tripInfoMessage = computed(() => {
  if (!currentTrip.value && tripError.value) {
    return `${tripError.value} Мы всё равно загрузили рабочий экран и оставили карту с безопасным центром, чтобы архитектура была готова к полному ответу API.`;
  }

  if (currentTrip.value && (typeof currentTrip.value.city_lat !== 'number' || typeof currentTrip.value.city_lng !== 'number')) {
    return 'Координаты города в ответе поездки пока не пришли, поэтому карта открыта с запасным центром на Москве. Когда backend начнёт отдавать city_lat и city_lng, карта автоматически будет центрироваться по поездке.';
  }

  return null;
});

const formatDistance = (value: number | null) => (
  typeof value === 'number'
    ? `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: value >= 10 ? 0 : 1 }).format(value)} км`
    : 'Пока нет данных'
);

const formatDuration = (minutes: number | null) => {
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

const fallbackSegments = computed<RouteMapSegment[]>(() => {
  const segments: RouteMapSegment[] = [];

  for (const group of dayGroups.value) {
    if (group.places.length < 2) {
      continue;
    }

    segments.push({
      day: group.day,
      latLngs: group.places.map((place) => [place.lat, place.lng] as [number, number]),
      isFallback: true,
    });
  }

  return segments;
});

const fallbackSegmentMap = computed(() => new Map(
  fallbackSegments.value.map((segment) => [segment.day, segment]),
));

const routeSegments = computed<RouteMapSegment[]>(() => {
  if (!builtRoute.value) {
    return [];
  }

  const routeDays = [...(builtRoute.value.days ?? [])].sort((left, right) => left.day - right.day);

  if (!routeDays.length) {
    return fallbackSegments.value;
  }

  const segments: RouteMapSegment[] = [];

  for (const routeDay of routeDays) {
    const geometryCoordinates = routeDay.geometry?.coordinates ?? [];
    const latLngs = geometryCoordinates
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

const hasServerGeometry = computed(() => routeSegments.value.some((segment) => !segment.isFallback));
const usesFallbackGeometry = computed(() => builtRoute.value !== null && (
  routeSegments.value.some((segment) => segment.isFallback) || !hasServerGeometry.value
));

const routeWarningMessage = computed(() => {
  if (!builtRoute.value || !usesFallbackGeometry.value) {
    return null;
  }

  if (hasServerGeometry.value) {
    return 'Часть геометрии маршрута не пришла от сервера, поэтому некоторые участки пока показаны прямыми линиями между местами.';
  }

  if (routeSegments.value.length) {
    return 'Маршрут построен, но геометрия линии пока не пришла от сервера. Временно показываем прямые линии между местами по порядку дня.';
  }

  return 'Маршрут построен, но геометрия линии пока не пришла от сервера.';
});

const routeSummary = computed(() => {
  if (!builtRoute.value) {
    return null;
  }

  const routeDays = builtRoute.value.days ?? [];
  const daysCount = routeDays.length || routeSegments.value.length || null;

  const distanceValues = routeDays
    .map((item) => item.distance_km)
    .filter((value): value is number => typeof value === 'number');

  const durationValues = routeDays
    .map((item) => item.duration_minutes)
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

const routeSummaryDescription = computed(() => {
  if (!builtRoute.value) {
    return '';
  }

  if (!routeSegments.value.length) {
    return 'Сервер принял запрос на построение маршрута. Как только в ответ начнёт приходить геометрия линии, карта автоматически отрисует маршрут поверх мест поездки.';
  }

  if (usesFallbackGeometry.value) {
    return 'Линия маршрута уже показана на карте. Когда сервер начнёт отдавать полную геометрию, она автоматически заменит временные прямые отрезки.';
  }

  return 'Линия маршрута отрисована на карте OpenStreetMap. Можно сверять последовательность точек по дням и быстро оценивать общий объём поездки.';
});

const clearTripSettingsState = () => {
  tripSettingsSubmitError.value = null;
  isTripSettingsOpen.value = false;
};

const clearShareState = () => {
  shareLink.value = null;
  shareMessage.value = null;
  shareError.value = null;
};

const buildShareLink = (shareResult: TripShareResult) => {
  if (shareResult.share_url) {
    return shareResult.share_url;
  }

  if (!import.meta.client) {
    return null;
  }

  const slug = shareResult.share_slug ?? currentTrip.value?.share_slug ?? null;
  const basePath = `/share/${encodeURIComponent(tripId.value)}`;

  if (slug) {
    return `${window.location.origin}${basePath}?slug=${encodeURIComponent(slug)}`;
  }

  return `${window.location.origin}${basePath}`;
};

const copyShareLink = async () => {
  if (!shareLink.value || !import.meta.client || !navigator.clipboard) {
    return;
  }

  try {
    await navigator.clipboard.writeText(shareLink.value);
    shareMessage.value = 'Ссылка скопирована. Другой пользователь сможет открыть её и добавить поездку себе.';
  } catch {
    shareMessage.value = 'Ссылка готова. Если копирование не сработало автоматически, можно скопировать её вручную.';
  }
};

const loadEditorData = async () => {
  if (!tripId.value) {
    tripsStore.clearError();
    placesStore.clearError();
    placesStore.selectPlace(null);
    routeStore.clearRoute();
    routeStore.clearError();
    clearTripSettingsState();
    clearShareState();
    return;
  }

  await Promise.all([
    tripsStore.fetchTrip(tripId.value),
    placesStore.fetchPlaces(tripId.value),
  ]);
};

const handleSelectPlace = (placeId: string) => {
  placesStore.selectPlace(placeId);
};

const handleDeletePlace = async (placeId: string) => {
  if (!tripId.value) {
    return;
  }

  const place = places.value.find((item) => item.uuid === placeId);

  if (!place) {
    return;
  }

  const shouldDelete = window.confirm(`Удалить место «${place.name}» из поездки?`);

  if (!shouldDelete) {
    return;
  }

  const deleted = await placesStore.deletePlace(tripId.value, placeId);

  if (!deleted) {
    return;
  }

  routeStore.clearRoute();
  routeStore.clearError();
};

const handleMovePlace = async (payload: { placeId: string; day: number; order: number }) => {
  if (!tripId.value) {
    return;
  }

  const updatedPlace = await placesStore.updatePlace(tripId.value, payload.placeId, {
    day: payload.day,
    order: payload.order + 1,
  });

  if (!updatedPlace) {
    return;
  }

  placesStore.selectPlace(updatedPlace.uuid);
  routeStore.clearRoute();
  routeStore.clearError();
};

const handleShareTrip = async () => {
  if (!tripId.value || !canShareTrip.value) {
    return;
  }

  clearShareState();
  tripsStore.clearError();

  const shareResult = await tripsStore.shareTrip(tripId.value);

  if (!shareResult) {
    shareError.value = tripError.value || tripsStore.error || 'Не удалось подготовить ссылку на поездку.';
    return;
  }

  const nextShareLink = buildShareLink(shareResult);

  if (!nextShareLink) {
    shareError.value = 'Ссылка на поездку подготовлена, но не удалось собрать адрес для отправки.';
    return;
  }

  shareLink.value = nextShareLink;

  if (shareResult.share_slug || shareResult.share_url) {
    shareMessage.value = 'Ссылка готова. Другой пользователь сможет открыть её и добавить поездку себе.';
  } else {
    shareMessage.value = 'Ссылка собрана по UUID поездки. Как только backend начнет отдавать slug или готовый URL, этот экран автоматически подхватит их.';
  }

  await copyShareLink();
};

const handleBuildRoute = async () => {
  if (!tripId.value || !canBuildRoute.value) {
    return;
  }

  await routeStore.buildRoute(tripId.value);
};

const openTripSettings = () => {
  if (!canOpenTripSettings.value) {
    return;
  }

  tripsStore.clearError();
  tripSettingsSubmitError.value = null;
  isTripSettingsOpen.value = true;
};

const handleTripSettingsSubmit = async (payload: UpdateTripPayload) => {
  if (!tripId.value || !currentTrip.value) {
    tripSettingsSubmitError.value = 'Поездка пока не загружена. Попробуйте открыть настройки ещё раз.';
    return;
  }

  isSavingTripSettings.value = true;
  tripSettingsSubmitError.value = null;
  tripsStore.clearError();

  try {
    const updatedTrip = await tripsStore.updateTrip(tripId.value, payload);

    if (!updatedTrip) {
      tripSettingsSubmitError.value = tripError.value || 'Не удалось обновить поездку. Попробуйте позже.';
      return;
    }

    routeStore.clearRoute();
    routeStore.clearError();
    isTripSettingsOpen.value = false;
  } finally {
    isSavingTripSettings.value = false;
  }
};

watch(tripId, () => {
  placesStore.selectPlace(null);
  routeStore.clearRoute();
  routeStore.clearError();
  clearTripSettingsState();
  clearShareState();
  void loadEditorData();
});

watch(isTripSettingsOpen, (isOpen) => {
  if (!isOpen) {
    tripSettingsSubmitError.value = null;
  }
});

useSeoMeta({
  title: () => currentTrip.value?.title ? `${currentTrip.value.title} — Попутно` : 'Поездка — Попутно',
  description: 'Рабочий экран поездки с днями маршрута и картой OpenStreetMap в приложении Попутно.',
});

routeStore.clearRoute();
routeStore.clearError();

if (import.meta.client) {
  await loadEditorData();
}
</script>
