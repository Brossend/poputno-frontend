<template>
  <article class="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_25px_rgba(15,23,42,0.04)]">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="break-words text-sm font-semibold text-slate-950">
          {{ result.name }}
        </p>

        <p class="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
          {{ categoryLabels[result.category] }}
        </p>

        <p v-if="result.address" class="mt-2 break-words text-sm leading-5 text-slate-500">
          {{ result.address }}
        </p>
      </div>

      <button
        type="button"
        class="inline-flex h-9 shrink-0 items-center justify-center rounded-2xl px-3 text-sm font-semibold transition"
        :class="isAdded
          ? 'bg-emerald-50 text-emerald-700'
          : expanded
            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            : 'bg-blue-600 text-white hover:bg-blue-700'"
        :disabled="isBusy || isAdded"
        @click="handlePrimaryAction"
      >
        {{ primaryLabel }}
      </button>
    </div>

    <div v-if="expanded && !isAdded" class="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            День
          </span>
          <select
            v-model="dayMode"
            class="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          >
            <option value="auto">
              Автоматически
            </option>
            <option v-for="day in dayOptions" :key="day" :value="String(day)">
              День {{ day }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Длительность
          </span>
          <input
            v-model.number="durationMinutes"
            type="number"
            min="15"
            step="15"
            class="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          >
        </label>
      </div>

      <label class="block">
        <span class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Категория
        </span>
        <select
          v-model="selectedCategory"
          class="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        >
          <option
            v-for="option in categoryOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>

      <p v-if="dayMode === 'auto'" class="text-sm leading-6 text-slate-500">
        День определится автоматически по темпу поездки.
      </p>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          class="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
          :disabled="isBusy"
          @click="$emit('cancel')"
        >
          Отмена
        </button>

        <button
          type="button"
          class="inline-flex h-10 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          :disabled="isBusy"
          @click="confirmAdd"
        >
          {{ isPending ? 'Добавляем...' : 'Добавить в поездку' }}
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { CreatePlacePayload, OsmSearchResult, PlaceCategory } from '~/types/place';

interface Props {
  result: OsmSearchResult;
  totalDays: number;
  expanded: boolean;
  isBusy: boolean;
  isPending: boolean;
  isAdded: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (event: 'expand'): void;
  (event: 'cancel'): void;
  (event: 'confirm-add', payload: CreatePlacePayload): void;
}>();

const categoryOptions: Array<{ value: PlaceCategory; label: string }> = [
  { value: 'attraction', label: 'Достопримечательность' },
  { value: 'museum', label: 'Музей' },
  { value: 'cafe', label: 'Кафе' },
  { value: 'restaurant', label: 'Ресторан' },
  { value: 'park', label: 'Парк' },
  { value: 'viewpoint', label: 'Смотровая' },
  { value: 'shopping', label: 'Шопинг' },
  { value: 'other', label: 'Другое' },
];

const categoryLabels: Record<PlaceCategory, string> = {
  attraction: 'Достопримечательность',
  museum: 'Музей',
  cafe: 'Кафе',
  restaurant: 'Ресторан',
  park: 'Парк',
  viewpoint: 'Смотровая',
  shopping: 'Шопинг',
  other: 'Другое',
};

const dayMode = ref('auto');
const durationMinutes = ref(60);
const selectedCategory = ref<PlaceCategory>(props.result.category);

const dayOptions = computed(() => Array.from({ length: Math.max(props.totalDays, 1) }, (_, index) => index + 1));

const primaryLabel = computed(() => {
  if (props.isAdded) {
    return 'Добавлено';
  }

  if (props.isPending) {
    return 'Добавляем...';
  }

  return props.expanded ? 'Свернуть' : 'Добавить';
});

const resetConfig = () => {
  dayMode.value = 'auto';
  durationMinutes.value = 60;
  selectedCategory.value = props.result.category;
};

const handlePrimaryAction = () => {
  if (props.isAdded) {
    return;
  }

  if (props.isBusy && !props.isPending) {
    return;
  }

  if (props.isPending) {
    return;
  }

  if (props.expanded) {
    emit('cancel');
    return;
  }

  emit('expand');
};

const confirmAdd = () => {
  const safeDuration = Math.max(15, Number(durationMinutes.value) || 60);

  emit('confirm-add', {
    name: props.result.name,
    lat: props.result.lat,
    lng: props.result.lng,
    category: selectedCategory.value,
    day: dayMode.value === 'auto' ? null : Number(dayMode.value),
    order: null,
    duration_minutes: safeDuration,
    osm_id: props.result.osm_id,
    address: props.result.address,
  });
};

watch(
  () => props.expanded,
  (expanded) => {
    if (expanded) {
      resetConfig();
    }
  },
);

watch(
  () => props.result,
  () => {
    resetConfig();
  },
  { deep: true },
);
</script>
