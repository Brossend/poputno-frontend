<template>
  <component
    :is="LPolyline"
    :lat-lngs="segment.latLngs"
    :color="strokeColor"
    :weight="segment.isFallback ? 4 : 5"
    :opacity="segment.isFallback ? 0.72 : 0.88"
    :dash-array="segment.isFallback ? '10 8' : undefined"
    line-cap="round"
    line-join="round"
  >
    <component :is="LTooltip" :sticky="true" direction="top">
      <div class="space-y-1 text-xs text-slate-700">
        <p class="font-semibold text-slate-950">
          День {{ segment.day }}
        </p>

        <p v-if="summaryText">
          {{ summaryText }}
        </p>

        <p v-if="segment.isFallback" class="text-slate-500">
          Временная прямая линия
        </p>
      </div>
    </component>
  </component>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import type { RouteMapSegment } from '~/types/route';

interface Props {
  segment: RouteMapSegment;
}

const props = defineProps<Props>();

const LPolyline = defineAsyncComponent(() => import('@vue-leaflet/vue-leaflet').then((module) => module.LPolyline));
const LTooltip = defineAsyncComponent(() => import('@vue-leaflet/vue-leaflet').then((module) => module.LTooltip));

const ROUTE_COLORS = [
  '#2563eb',
  '#0f766e',
  '#7c3aed',
  '#ea580c',
  '#dc2626',
  '#0891b2',
];

const formatDistance = (value?: number) => (
  typeof value === 'number'
    ? `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: value >= 10 ? 0 : 1 }).format(value)} км`
    : null
);

const formatDuration = (minutes?: number) => {
  if (typeof minutes !== 'number') {
    return null;
  }

  if (minutes < 60) {
    return `${minutes} мин`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes ? `${hours} ч ${remainingMinutes} мин` : `${hours} ч`;
};

const strokeColor = computed(() => ROUTE_COLORS[(Math.max(props.segment.day, 1) - 1) % ROUTE_COLORS.length]);

const summaryText = computed(() => {
  const parts = [
    formatDistance(props.segment.distance_km),
    formatDuration(props.segment.duration_minutes),
  ].filter((value): value is string => Boolean(value));

  return parts.join(' • ');
});
</script>
