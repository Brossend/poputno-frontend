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
          :key="`route-${segment.day}`"
          :segment="segment"
        />

        <component
          :is="LCircleMarker"
          v-for="place in places"
          :key="place.uuid"
          :lat-lng="[place.lat, place.lng]"
          :radius="selectedPlaceId === place.uuid ? 11 : 8"
          :color="selectedPlaceId === place.uuid ? '#1d4ed8' : '#2563eb'"
          :fill-color="selectedPlaceId === place.uuid ? '#1d4ed8' : '#60a5fa'"
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

const isClient = ref(false);
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

watch(
  () => [props.center.lat, props.center.lng] as const,
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

    syncMapView([props.center.lat, props.center.lng], DEFAULT_ZOOM);
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

onMounted(() => {
  isClient.value = true;
});
</script>

<style scoped>
:deep(.leaflet-control-attribution) {
  display: none;
}
</style>
