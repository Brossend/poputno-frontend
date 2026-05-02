<template>
  <section class="rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-[0_20px_55px_rgba(15,23,42,0.14)] backdrop-blur">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-slate-950">
          Поиск мест
        </p>
        <p class="mt-1 text-sm leading-6 text-slate-500">
          Ищите достопримечательности, кафе и музеи рядом с поездкой.
        </p>
      </div>

      <span v-if="tripCity" class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
        {{ tripCity }}
      </span>
    </div>

    <div class="mt-4">
      <label class="sr-only" for="place-search-input">
        Найти место, кафе или музей
      </label>
      <div class="relative">
        <input
          id="place-search-input"
          v-model="query"
          type="text"
          placeholder="Найти место, кафе или музей"
          class="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
        >

        <div class="pointer-events-none absolute inset-y-0 right-4 flex items-center">
          <svg
            v-if="isLoading"
            class="h-4 w-4 animate-spin text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.2" stroke-width="3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-linecap="round" stroke-width="3" />
          </svg>

          <svg
            v-else
            class="h-4 w-4 text-slate-400"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path d="M8.75 3.75a5 5 0 1 0 3.104 8.92l3.613 3.612a.75.75 0 1 0 1.06-1.06l-3.612-3.613A5 5 0 0 0 8.75 3.75Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
          </svg>
        </div>
      </div>
    </div>

    <p v-if="query.trim().length > 0 && query.trim().length < 3" class="mt-3 text-sm text-slate-500">
      Введите минимум 3 символа, чтобы начать поиск.
    </p>

    <div
      v-if="searchError || addError"
      class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
    >
      {{ searchError || addError }}
    </div>

    <div v-if="query.trim().length >= 3" class="mt-4">
      <div v-if="isLoading && results.length === 0" class="space-y-3">
        <div
          v-for="placeholder in 3"
          :key="placeholder"
          class="h-28 animate-pulse rounded-[24px] border border-slate-200 bg-slate-50"
        />
      </div>

      <div
        v-else-if="!isLoading && !searchError && results.length === 0 && hasSearched"
        class="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500"
      >
        По этому запросу ничего не нашлось. Попробуйте уточнить место, категорию или название района.
      </div>

      <div v-else class="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
        <PlaceSearchResultItem
          v-for="result in results"
          :key="result.osm_id"
          :result="result"
          :total-days="totalDays"
          :expanded="expandedResultId === result.osm_id"
          :is-busy="isAdding"
          :is-pending="isAdding && pendingResultId === result.osm_id"
          :is-added="isResultAdded(result)"
          @expand="handleExpand(result.osm_id)"
          @cancel="handleCollapse"
          @confirm-add="handleAdd(result.osm_id, $event)"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import PlaceSearchResultItem from '~/components/map/PlaceSearchResultItem.vue';
import { useNominatimSearch } from '~/composables/useNominatimSearch';
import { usePlacesStore } from '~/stores/places';
import type { CreatePlacePayload, OsmSearchResult, Place } from '~/types/place';

interface Props {
  tripId: string;
  tripCity?: string | null;
  center?: { lat: number; lng: number } | null;
  totalDays: number;
}

const props = defineProps<Props>();

const placesStore = usePlacesStore();
const { isAdding, places } = storeToRefs(placesStore);
const { results, isLoading, error: searchError, searchPlaces, clearResults, abortSearch } = useNominatimSearch();

const query = ref('');
const hasSearched = ref(false);
const addError = ref('');
const expandedResultId = ref<number | null>(null);
const pendingResultId = ref<number | null>(null);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const resetDebounce = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
};

const clearAddError = () => {
  addError.value = '';
};

const isResultAdded = (result: OsmSearchResult) => places.value.some((place: Place) => (
  (place.osm_id !== null && place.osm_id === result.osm_id)
  || (place.name === result.name && place.lat === result.lat && place.lng === result.lng)
));

const handleExpand = (osmId: number) => {
  clearAddError();
  expandedResultId.value = osmId;
};

const handleCollapse = () => {
  expandedResultId.value = null;
  pendingResultId.value = null;
};

const handleAdd = async (osmId: number, payload: CreatePlacePayload) => {
  clearAddError();
  placesStore.clearError();
  pendingResultId.value = osmId;

  const createdPlace = await placesStore.addPlace(props.tripId, payload);

  pendingResultId.value = null;

  if (!createdPlace) {
    addError.value = placesStore.error ?? 'Не удалось добавить место в поездку.';
    placesStore.clearError();
    return;
  }

  expandedResultId.value = null;
  addError.value = '';
};

watch(query, (value) => {
  resetDebounce();
  clearAddError();

  const trimmedValue = value.trim();

  if (trimmedValue.length < 3) {
    hasSearched.value = false;
    expandedResultId.value = null;
    abortSearch();
    clearResults();
    return;
  }

  debounceTimer = setTimeout(async () => {
    hasSearched.value = true;
    await searchPlaces(trimmedValue, {
      city: props.tripCity,
      center: props.center,
    });
  }, 500);
});

watch(
  () => props.tripId,
  () => {
    query.value = '';
    hasSearched.value = false;
    handleCollapse();
    clearResults();
    clearAddError();
  },
);

onBeforeUnmount(() => {
  resetDebounce();
  abortSearch();
});
</script>
