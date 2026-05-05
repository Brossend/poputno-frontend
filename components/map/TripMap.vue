<template>
  <div class="relative h-full min-h-[320px] overflow-hidden rounded-[30px] border border-slate-200 bg-slate-100 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
    <ClientOnly>
      <template #fallback>
        <div class="flex h-full min-h-[320px] items-center justify-center bg-slate-100 text-sm text-slate-500">
          Загружаем карту OpenStreetMap...
        </div>
      </template>

      <component
        :is="LMap"
        v-if="isClient"
        ref="mapRef"
        :zoom="zoom"
        :center="mapCenter"
        :use-global-leaflet="false"
        :options="{ attributionControl: false }"
        class="h-full min-h-[320px] w-full"
      >
        <component
          :is="LTileLayer"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          layer-type="base"
          name="OpenStreetMap"
        />

        <RoutePolyline
          v-for="segment in routeSegments"
          :key="`route-${segment.day}-${segment.duration_minutes ?? 'na'}-${segment.distance_km ?? 'na'}-${segment.isFallback ? 'fallback' : 'full'}-${segment.latLngs.length}`"
          :segment="segment"
        />

        <component
          :is="LCircleMarker"
          v-for="place in places"
          :key="place.uuid"
          :lat-lng="[place.lat, place.lng]"
          :radius="selectedPlaceId === place.uuid ? 11 : 8"
          :color="getMarkerColor(place.day, selectedPlaceId === place.uuid).stroke"
          :fill-color="getMarkerColor(place.day, selectedPlaceId === place.uuid).fill"
          :fill-opacity="0.9"
          :weight="selectedPlaceId === place.uuid ? 3 : 2"
          @click="$emit('select-place', place.uuid)"
        >
          <component :is="LPopup">
            <div class="max-w-[220px] space-y-2 text-sm text-slate-700">
              <p class="text-base font-semibold text-slate-950">
                {{ place.name }}
              </p>

              <p v-if="place.address" class="leading-5 text-slate-500">
                {{ place.address }}
              </p>

              <dl class="space-y-1 text-xs uppercase tracking-[0.12em] text-slate-400">
                <div class="flex items-center justify-between gap-3">
                  <dt>День</dt>
                  <dd class="font-semibold text-slate-700">
                    {{ place.day }}
                  </dd>
                </div>

                <div class="flex items-center justify-between gap-3">
                  <dt>Длительность</dt>
                  <dd class="font-semibold normal-case tracking-normal text-slate-700">
                    {{ formatDuration(place.duration_minutes) }}
                  </dd>
                </div>
              </dl>
            </div>
          </component>
        </component>
      </component>
    </ClientOnly>

    <div class="absolute right-4 top-4 z-[500] flex flex-col items-end gap-3">
      <button
        type="button"
        class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/90 bg-white/95 text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.14)] transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isLocating"
        aria-label="Показать мою геолокацию"
        @click="focusUserLocation"
      >
        <svg v-if="!isLocating" class="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2.25v2.1m0 11.3v2.1m7.75-7.75h-2.1M4.35 10H2.25m11.58-4.68-1.49 1.48m-4.68 4.69-1.48 1.48m7.65 0-1.49-1.48m-4.68-4.69L6.17 5.32M12.75 10A2.75 2.75 0 1 1 7.25 10a2.75 2.75 0 0 1 5.5 0Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
        </svg>

        <svg v-else class="h-5 w-5 animate-spin" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 3a7 7 0 1 1-4.95 2.05" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
        </svg>
      </button>

      <div
        v-if="locationError"
        class="max-w-[220px] rounded-2xl border border-amber-200 bg-white/95 px-3 py-2 text-xs leading-5 text-amber-900 shadow-[0_10px_28px_rgba(15,23,42,0.12)]"
      >
        {{ locationError }}
      </div>
    </div>

    <div
      v-if="!places.length"
      class="pointer-events-none absolute bottom-4 left-4 right-4 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-[0_12px_35px_rgba(15,23,42,0.10)]"
    >
      Пока на карте нет точек маршрута. Когда места появятся в поездке, они сразу отобразятся здесь.
    </div>
  </div>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import RoutePolyline from '~/components/map/RoutePolyline.vue';
import type { Place } from '~/types/place';
import type { RouteMapSegment } from '~/types/route';

interface MapCenter {
  lat: number;
  lng: number;
}

interface Props {
  center: MapCenter;
  cityName?: string | null;
  hasExplicitCenter?: boolean;
  places: Place[];
  selectedPlaceId: string | null;
  routeSegments: RouteMapSegment[];
}

defineEmits<{
  (event: 'select-place', placeId: string): void;
}>();

const props = defineProps<Props>();

const LMap = defineAsyncComponent(() => import('@vue-leaflet/vue-leaflet').then((module) => module.LMap));
const LTileLayer = defineAsyncComponent(() => import('@vue-leaflet/vue-leaflet').then((module) => module.LTileLayer));
const LCircleMarker = defineAsyncComponent(() => import('@vue-leaflet/vue-leaflet').then((module) => module.LCircleMarker));
const LPopup = defineAsyncComponent(() => import('@vue-leaflet/vue-leaflet').then((module) => module.LPopup));

const DEFAULT_ZOOM = 12;
const SELECTED_PLACE_ZOOM = 14;
const USER_LOCATION_ZOOM = 15;
const DAY_MARKER_COLORS = [
  { stroke: '#2563eb', fill: '#60a5fa', selected: '#1d4ed8' },
  { stroke: '#0f766e', fill: '#2dd4bf', selected: '#115e59' },
  { stroke: '#7c3aed', fill: '#a78bfa', selected: '#6d28d9' },
  { stroke: '#ea580c', fill: '#fb923c', selected: '#c2410c' },
  { stroke: '#dc2626', fill: '#f87171', selected: '#b91c1c' },
  { stroke: '#0891b2', fill: '#22d3ee', selected: '#0e7490' },
] as const;
const LOCATION_REQUESTS = [
  {
    enableHighAccuracy: false,
    timeout: 8000,
    maximumAge: 300000,
  },
  {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 0,
  },
] as const;

const isClient = ref(false);
const isLocating = ref(false);
const locationError = ref<string | null>(null);
const cityCenter = ref<[number, number] | null>(null);
const zoom = ref(DEFAULT_ZOOM);
const mapCenter = ref<[number, number]>([props.center.lat, props.center.lng]);
const mapRef = ref<{
  leafletObject?: {
    fitBounds?: (bounds: [[number, number], [number, number]], options?: { animate?: boolean; padding?: [number, number] }) => void;
    setView?: (center: [number, number], zoom: number, options?: { animate?: boolean }) => void;
  };
} | null>(null);

const selectedPlace = computed(() => (
  props.places.find((place) => place.uuid === props.selectedPlaceId) ?? null
));

const resolvedCenter = computed<[number, number]>(() => {
  if (props.hasExplicitCenter) {
    return [props.center.lat, props.center.lng];
  }

  if (cityCenter.value) {
    return cityCenter.value;
  }

  return [props.center.lat, props.center.lng];
});

const routeBounds = computed<[[number, number], [number, number]] | null>(() => {
  const points = props.routeSegments.flatMap((segment) => segment.latLngs);

  if (points.length < 2) {
    return null;
  }

  const [firstLat, firstLng] = points[0]!;

  let minLat = firstLat;
  let maxLat = firstLat;
  let minLng = firstLng;
  let maxLng = firstLng;

  for (const [lat, lng] of points) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
});

const syncMapView = (center: [number, number], nextZoom: number) => {
  mapCenter.value = center;
  zoom.value = nextZoom;
  mapRef.value?.leafletObject?.setView?.(center, nextZoom, { animate: true });
};

const fitRouteBounds = (bounds: [[number, number], [number, number]]) => {
  const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
  const centerLng = (bounds[0][1] + bounds[1][1]) / 2;

  mapCenter.value = [centerLat, centerLng];
  mapRef.value?.leafletObject?.fitBounds?.(bounds, {
    animate: true,
    padding: [32, 32],
  });
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} мин`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes ? `${hours} ч ${remainingMinutes} мин` : `${hours} ч`;
};

const getMarkerColor = (day: number, isSelected: boolean) => {
  const palette = DAY_MARKER_COLORS[(Math.max(day, 1) - 1) % DAY_MARKER_COLORS.length] ?? DAY_MARKER_COLORS[0];

  return {
    stroke: isSelected ? palette.selected : palette.stroke,
    fill: isSelected ? palette.selected : palette.fill,
  };
};

const resolveCityCenter = async (cityName: string) => {
  const trimmedCityName = cityName.trim();

  if (!trimmedCityName || props.hasExplicitCenter || !import.meta.client) {
    return;
  }

  try {
    const response = await $fetch<Array<{ lat?: string; lon?: string }>>('https://nominatim.openstreetmap.org/search', {
      query: {
        q: trimmedCityName,
        format: 'json',
        limit: 1,
        'accept-language': 'ru',
      },
      headers: {
        Accept: 'application/json',
      },
    });

    const firstResult = Array.isArray(response) ? response[0] : null;
    const lat = Number(firstResult?.lat);
    const lng = Number(firstResult?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    cityCenter.value = [lat, lng];

    if (!selectedPlace.value && !routeBounds.value) {
      syncMapView([lat, lng], DEFAULT_ZOOM);
    }
  } catch {
    // Keep default fallback center if city geocoding fails.
  }
};

const getCurrentPosition = (options: PositionOptions) => new Promise<GeolocationPosition>((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(resolve, reject, options);
});

const getLocationErrorMessage = (error: GeolocationPositionError) => {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Доступ к геолокации запрещен в браузере.';
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'Не удалось определить ваше местоположение.';
  }

  if (error.code === error.TIMEOUT) {
    return 'Геолокация отвечает слишком долго. Попробуйте еще раз.';
  }

  return 'Не удалось получить вашу геолокацию.';
};

const focusUserLocation = async () => {
  if (!import.meta.client || isLocating.value) {
    return;
  }

  if (!navigator.geolocation) {
    locationError.value = 'Браузер не поддерживает геолокацию.';
    return;
  }

  isLocating.value = true;
  locationError.value = null;

  try {
    let position: GeolocationPosition | null = null;
    let lastError: GeolocationPositionError | null = null;

    for (const requestOptions of LOCATION_REQUESTS) {
      try {
        position = await getCurrentPosition(requestOptions);
        break;
      } catch (error) {
        if (!(error instanceof GeolocationPositionError)) {
          throw error;
        }

        lastError = error;

        if (error.code === error.PERMISSION_DENIED) {
          break;
        }
      }
    }

    if (!position) {
      locationError.value = lastError ? getLocationErrorMessage(lastError) : 'Не удалось получить вашу геолокацию.';
      return;
    }

    syncMapView(
      [position.coords.latitude, position.coords.longitude],
      USER_LOCATION_ZOOM,
    );
  } catch {
    locationError.value = 'Не удалось получить вашу геолокацию.';
  } finally {
    isLocating.value = false;
  }
};

watch(
  () => [resolvedCenter.value[0], resolvedCenter.value[1]] as const,
  ([lat, lng]) => {
    if (selectedPlace.value) {
      return;
    }

    if (routeBounds.value) {
      fitRouteBounds(routeBounds.value);
      return;
    }

    syncMapView([lat, lng], DEFAULT_ZOOM);
  },
  { immediate: true },
);

watch(selectedPlace, (place) => {
  if (!place) {
    if (routeBounds.value) {
      fitRouteBounds(routeBounds.value);
      return;
    }

    syncMapView(resolvedCenter.value, DEFAULT_ZOOM);
    return;
  }

  syncMapView([place.lat, place.lng], SELECTED_PLACE_ZOOM);
});

watch(
  () => props.routeSegments,
  () => {
    if (selectedPlace.value || !routeBounds.value) {
      return;
    }

    fitRouteBounds(routeBounds.value);
  },
  { deep: true },
);

watch(
  () => [props.cityName, props.hasExplicitCenter] as const,
  ([cityName, hasExplicitCenter]) => {
    if (hasExplicitCenter) {
      cityCenter.value = null;
      return;
    }

    cityCenter.value = null;

    if (cityName) {
      void resolveCityCenter(cityName);
    }
  },
  { immediate: true },
);

onMounted(() => {
  isClient.value = true;
});
</script>

<style scoped>
:deep(.leaflet-control-attribution) {
  display: none;
}
</style>
