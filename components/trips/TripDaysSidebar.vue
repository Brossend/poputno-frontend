<template>
  <aside class="flex h-full flex-col rounded-[30px] border border-slate-200 bg-slate-50/70">
    <div class="border-b border-slate-200 px-5 py-4">
      <p class="text-sm font-semibold text-slate-950">
        Дни и места
      </p>
      <p class="mt-1 text-sm text-slate-500">
        Выбирайте день, смотрите порядок мест и синхронизируйте список с картой.
      </p>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-4">
      <div v-if="error" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {{ error }}
      </div>

      <div v-else-if="isLoading" class="space-y-3">
        <div
          v-for="placeholder in Math.max(totalDays, 2)"
          :key="placeholder"
          class="h-32 animate-pulse rounded-[26px] border border-slate-200 bg-white"
        />
      </div>

      <div
        v-else-if="!hasAnyPlaces"
        class="rounded-[28px] border border-dashed border-slate-200 bg-white px-5 py-6 text-center"
      >
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 21s6-5.372 6-9.8A6 6 0 1 0 6 11.2C6 15.628 12 21 12 21Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" />
            <circle cx="12" cy="11" r="2.4" stroke="currentColor" stroke-width="1.6" />
          </svg>
        </div>

        <h2 class="mt-4 text-lg font-semibold text-slate-950">
          Пока нет мест
        </h2>

        <p class="mt-2 text-sm leading-6 text-slate-500">
          Найдите место на карте и добавьте его в маршрут.
        </p>
      </div>

      <div v-else class="space-y-4">
        <TripDayColumn
          v-for="group in normalizedDayGroups"
          :key="group.day"
          :day="group.day"
          :places="group.places"
          :selected-place-id="selectedPlaceId"
          :is-mutating="isMutating"
          @select-place="$emit('select-place', $event)"
          @delete-place="$emit('delete-place', $event)"
          @move-place="$emit('move-place', $event)"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import TripDayColumn from '~/components/trips/TripDayColumn.vue';
import type { Place } from '~/types/place';

interface DayGroup {
  day: number;
  places: Place[];
}

interface MovePlacePayload {
  placeId: string;
  day: number;
  order: number;
}

interface Props {
  dayGroups: DayGroup[];
  totalDays: number;
  selectedPlaceId: string | null;
  isLoading: boolean;
  error: string | null;
  isMutating?: boolean;
}

defineEmits<{
  (event: 'select-place', placeId: string): void;
  (event: 'delete-place', placeId: string): void;
  (event: 'move-place', payload: MovePlacePayload): void;
}>();

const props = withDefaults(defineProps<Props>(), {
  isMutating: false,
});

const normalizedDayGroups = computed<DayGroup[]>(() => {
  const source = new Map(props.dayGroups.map((group) => [group.day, group.places]));
  const groups: DayGroup[] = [];
  const fallbackDays = source.size > 0 ? Math.max(...source.keys()) : 1;
  const safeTotalDays = Math.max(props.totalDays, fallbackDays, 1);

  for (let day = 1; day <= safeTotalDays; day += 1) {
    groups.push({
      day,
      places: source.get(day) ?? [],
    });
  }

  return groups;
});

const hasAnyPlaces = computed(() => props.dayGroups.some((group) => group.places.length > 0));
</script>
