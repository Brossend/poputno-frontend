<template>
  <div>
    <label class="block text-sm font-medium text-slate-700" :for="inputId">
      {{ label }}
    </label>

    <div class="relative mt-2">
      <input
        :id="inputId"
        v-model="query"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        autocomplete="off"
        class="h-12 w-full rounded-2xl border bg-white px-4 pr-11 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        :class="error ? 'border-red-300' : 'border-slate-200'"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.escape="closeDropdown"
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

      <div
        v-if="showDropdown"
        class="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_65px_rgba(15,23,42,0.14)]"
      >
        <div v-if="isLoading" class="px-4 py-3 text-sm text-slate-500">
          Ищем подходящие города...
        </div>

        <div v-else-if="searchError" class="px-4 py-3 text-sm text-red-600">
          {{ searchError }}
        </div>

        <div v-else-if="results.length === 0" class="px-4 py-3 text-sm text-slate-500">
          Ничего не нашли. Попробуйте уточнить запрос.
        </div>

        <ul v-else class="max-h-80 overflow-y-auto py-2">
          <li v-for="option in results" :key="`${option.displayName}-${option.lat}-${option.lng}`">
            <button
              type="button"
              class="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-blue-50"
              @mousedown.prevent="selectOption(option)"
            >
              <span class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 17s5-4.479 5-8.167A5 5 0 1 0 5 8.833C5 12.521 10 17 10 17Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
                  <circle cx="10" cy="8.5" r="1.75" stroke="currentColor" stroke-width="1.5" />
                </svg>
              </span>

              <span class="min-w-0">
                <span class="block break-words text-sm font-medium text-slate-900">
                  {{ option.city }}
                </span>
                <span class="mt-1 block break-words text-xs leading-5 text-slate-500">
                  {{ option.displayName }}
                </span>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <p v-if="selectedCity" class="mt-2 text-xs leading-5 text-slate-500">
      Выбран город: <span class="font-medium text-slate-700">{{ selectedCity.city }}</span>
      <span class="text-slate-400"> · {{ formatCoordinate(selectedCity.lat) }}, {{ formatCoordinate(selectedCity.lng) }}</span>
    </p>

    <p v-if="error" class="mt-1.5 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { TripCityOption } from '~/types/trip';

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
  hamlet?: string;
}

interface NominatimSearchResult {
  place_id: number | string;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: NominatimAddress;
}

interface Props {
  modelValue: string;
  selectedCity: TripCityOption | null;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Город',
  placeholder: 'Например, Москва',
  disabled: false,
  error: '',
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
  (event: 'update:selectedCity', value: TripCityOption | null): void;
  (event: 'blur'): void;
}>();

const inputId = useId();
const query = ref(props.modelValue);
const results = ref<TripCityOption[]>([]);
const isLoading = ref(false);
const isOpen = ref(false);
const hasSearched = ref(false);
const searchError = ref('');

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let blurTimer: ReturnType<typeof setTimeout> | null = null;
let abortController: AbortController | null = null;
let requestSequence = 0;
let isSelectingOption = false;

const showDropdown = computed(() => (
  isOpen.value
  && query.value.trim().length >= 2
  && (isLoading.value || Boolean(searchError.value) || results.value.length > 0 || hasSearched.value)
));

const clearTimers = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (blurTimer) {
    clearTimeout(blurTimer);
    blurTimer = null;
  }
};

const abortRequest = () => {
  abortController?.abort();
  abortController = null;
};

const getCityLabel = (item: NominatimSearchResult): string => (
  item.address?.city
  ?? item.address?.town
  ?? item.address?.municipality
  ?? item.address?.village
  ?? item.address?.hamlet
  ?? item.address?.county
  ?? item.name
  ?? item.display_name.split(',')[0]?.trim()
  ?? ''
);

const normalizeSearchResults = (payload: NominatimSearchResult[]): TripCityOption[] => {
  const seen = new Set<string>();

  return payload.flatMap((item) => {
    const city = getCityLabel(item).trim();
    const lat = Number.parseFloat(item.lat);
    const lng = Number.parseFloat(item.lon);

    if (!city || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return [];
    }

    const key = `${city}|${item.display_name}|${lat}|${lng}`;

    if (seen.has(key)) {
      return [];
    }

    seen.add(key);

    return [{
      city,
      displayName: item.display_name,
      lat,
      lng,
    }];
  });
};

const performSearch = async (searchTerm: string) => {
  abortRequest();

  const currentRequest = ++requestSequence;
  const controller = new AbortController();
  abortController = controller;
  isLoading.value = true;
  searchError.value = '';
  isOpen.value = true;

  try {
    const response = await $fetch<NominatimSearchResult[]>('https://nominatim.openstreetmap.org/search', {
      query: {
        q: searchTerm,
        format: 'json',
        addressdetails: 1,
        limit: 5,
        'accept-language': 'ru',
      },
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (currentRequest !== requestSequence) {
      return;
    }

    results.value = normalizeSearchResults(response);
    hasSearched.value = true;
  } catch (error) {
    if (controller.signal.aborted) {
      return;
    }

    results.value = [];
    hasSearched.value = true;
    searchError.value = 'Не удалось получить результаты поиска. Попробуйте чуть позже.';
  } finally {
    if (currentRequest === requestSequence) {
      isLoading.value = false;
    }

    if (abortController === controller) {
      abortController = null;
    }
  }
};

const closeDropdown = () => {
  isOpen.value = false;
};

const handleFocus = () => {
  if (query.value.trim().length >= 2 && (results.value.length > 0 || hasSearched.value || Boolean(searchError.value))) {
    isOpen.value = true;
  }
};

const handleBlur = () => {
  blurTimer = setTimeout(() => {
    closeDropdown();
    emit('blur');
  }, 120);
};

const selectOption = (option: TripCityOption) => {
  clearTimers();
  isSelectingOption = true;
  query.value = option.city;
  emit('update:selectedCity', option);
  results.value = [];
  searchError.value = '';
  hasSearched.value = false;
  closeDropdown();
};

const formatCoordinate = (value: number) => value.toFixed(4);

watch(
  () => props.modelValue,
  (value) => {
    if (value !== query.value) {
      query.value = value;
    }
  },
);

watch(query, (value) => {
  emit('update:modelValue', value);

  if (isSelectingOption) {
    isSelectingOption = false;
    return;
  }

  if (props.selectedCity && value.trim() !== props.selectedCity.city) {
    emit('update:selectedCity', null);
  }

  clearTimers();
  abortRequest();
  searchError.value = '';
  hasSearched.value = false;

  const trimmedValue = value.trim();

  if (trimmedValue.length < 2) {
    results.value = [];
    isLoading.value = false;
    closeDropdown();
    return;
  }

  debounceTimer = setTimeout(() => {
    void performSearch(trimmedValue);
  }, 500);
});

onBeforeUnmount(() => {
  clearTimers();
  abortRequest();
});
</script>
