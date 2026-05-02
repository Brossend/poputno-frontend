<template>
  <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
    <section class="rounded-[30px] border border-slate-200 bg-slate-50/80 p-5 sm:p-6">
      <form class="space-y-6" novalidate @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-slate-700" for="trip-title">
            Название поездки
          </label>

          <input
            id="trip-title"
            v-model="form.title"
            type="text"
            placeholder="Москва на выходные"
            class="mt-2 h-12 w-full rounded-2xl border bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            :class="fieldErrors.title ? 'border-red-300' : 'border-slate-200'"
            @blur="validateTitle"
          >

          <p v-if="fieldErrors.title" class="mt-1.5 text-sm text-red-600">
            {{ fieldErrors.title }}
          </p>
        </div>

        <CitySearchInput
          v-model="form.cityQuery"
          v-model:selected-city="selectedCity"
          :error="fieldErrors.city"
          :disabled="isCreating"
          @blur="validateCity"
        />

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-700" for="trip-date-from">
              Дата начала
            </label>

            <input
              id="trip-date-from"
              v-model="form.date_from"
              type="date"
              class="mt-2 h-12 w-full rounded-2xl border bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              :class="fieldErrors.date_from ? 'border-red-300' : 'border-slate-200'"
              @blur="validateDateFrom"
            >

            <p v-if="fieldErrors.date_from" class="mt-1.5 text-sm text-red-600">
              {{ fieldErrors.date_from }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700" for="trip-date-to">
              Дата окончания
            </label>

            <input
              id="trip-date-to"
              v-model="form.date_to"
              type="date"
              :min="form.date_from || undefined"
              class="mt-2 h-12 w-full rounded-2xl border bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              :class="fieldErrors.date_to ? 'border-red-300' : 'border-slate-200'"
              @blur="validateDateTo"
            >

            <p v-if="fieldErrors.date_to" class="mt-1.5 text-sm text-red-600">
              {{ fieldErrors.date_to }}
            </p>
          </div>
        </div>

        <fieldset>
          <legend class="text-sm font-medium text-slate-700">
            Темп поездки
          </legend>

          <div class="mt-3 grid gap-3">
            <label
              v-for="option in paceOptions"
              :key="option.value"
              class="relative block cursor-pointer rounded-3xl border bg-white p-4 transition"
              :class="form.pace === option.value
                ? 'border-blue-300 bg-blue-50 shadow-[0_16px_35px_rgba(37,99,235,0.12)]'
                : 'border-slate-200 hover:border-blue-200 hover:bg-blue-50/50'"
            >
              <input
                v-model="form.pace"
                type="radio"
                name="trip-pace"
                class="sr-only"
                :value="option.value"
                @change="validatePace"
              >

              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-base font-semibold text-slate-950">
                    {{ option.label }}
                  </p>

                  <p class="mt-1 text-sm text-slate-500">
                    {{ option.hint }}
                  </p>
                </div>

                <span
                  class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                  :class="form.pace === option.value ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-transparent'"
                >
                  <svg class="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2.5 6.25 4.75 8.5 9.5 3.75" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" />
                  </svg>
                </span>
              </div>
            </label>
          </div>

          <p v-if="fieldErrors.pace" class="mt-1.5 text-sm text-red-600">
            {{ fieldErrors.pace }}
          </p>
        </fieldset>

        <div class="rounded-3xl border border-slate-200 bg-white px-4 py-4">
          <p class="text-sm font-medium text-slate-700">
            Что попадёт в поездку
          </p>

          <ul class="mt-3 space-y-2 text-sm leading-6 text-slate-500">
            <li>Город и координаты будут сохранены из выбранного результата OpenStreetMap.</li>
            <li>После создания вы сразу перейдёте в редактор поездки.</li>
            <li>Темп поможет дальше распределять места по дням маршрута.</li>
          </ul>
        </div>

        <div class="space-y-4 border-t border-slate-200 pt-2">
          <p
            v-if="apiError"
            class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {{ apiError }}
          </p>

          <button
            type="submit"
            class="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            :disabled="submitDisabled"
          >
            {{ isCreating ? 'Создаём...' : 'Создать поездку' }}
          </button>
        </div>
      </form>
    </section>

    <aside class="xl:sticky xl:top-24 xl:self-start">
      <div class="overflow-hidden rounded-[30px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 shadow-[0_22px_60px_rgba(37,99,235,0.12)]">
        <div class="border-b border-blue-100 px-5 py-5">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Preview
          </p>

          <h2 class="mt-3 text-2xl font-semibold text-slate-950">
            {{ previewTitle }}
          </h2>

          <p class="mt-2 text-sm leading-6 text-slate-500">
            Так будет выглядеть основа новой поездки в Попутно.
          </p>
        </div>

        <div class="space-y-4 px-5 py-5">
          <div class="rounded-3xl bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Город
            </p>
            <p class="mt-2 text-base font-medium text-slate-950">
              {{ previewCity }}
            </p>
            <p class="mt-1 text-sm leading-5 text-slate-500">
              {{ previewLocationNote }}
            </p>
          </div>

          <div class="rounded-3xl bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Даты
            </p>
            <p class="mt-2 text-base font-medium text-slate-950">
              {{ previewDates }}
            </p>
            <p class="mt-1 text-sm leading-5 text-slate-500">
              {{ previewDays }}
            </p>
          </div>

          <div class="rounded-3xl bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Темп
            </p>
            <p class="mt-2 text-base font-medium text-slate-950">
              {{ selectedPaceOption.label }}
            </p>
            <p class="mt-1 text-sm leading-5 text-slate-500">
              {{ selectedPaceOption.hint }}
            </p>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import CitySearchInput from '~/components/geo/CitySearchInput.vue';
import { useTripsStore } from '~/stores/trips';
import type { CreateTripPayload, TripCityOption, TripPace } from '~/types/trip';

interface TripCreateFormState {
  title: string;
  cityQuery: string;
  date_from: string;
  date_to: string;
  pace: TripPace;
}

interface FieldErrors {
  title: string;
  city: string;
  date_from: string;
  date_to: string;
  pace: string;
}

const tripsStore = useTripsStore();
const { error: apiError, isCreating } = storeToRefs(tripsStore);

const form = reactive<TripCreateFormState>({
  title: '',
  cityQuery: '',
  date_from: '',
  date_to: '',
  pace: 'moderate',
});

const selectedCity = ref<TripCityOption | null>(null);
const fieldErrors = reactive<FieldErrors>({
  title: '',
  city: '',
  date_from: '',
  date_to: '',
  pace: '',
});

const paceOptions: Array<{ value: TripPace; label: string; hint: string }> = [
  {
    value: 'relaxed',
    label: 'Спокойный',
    hint: 'До 4 мест в день',
  },
  {
    value: 'moderate',
    label: 'Умеренный',
    hint: 'До 6 мест в день',
  },
  {
    value: 'intensive',
    label: 'Интенсивный',
    hint: 'До 9 мест в день',
  },
];

const defaultPaceOption = paceOptions[1]!;

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const parseDateString = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
};

const formatDate = (value: string) => {
  const date = parseDateString(value);

  return date ? dateFormatter.format(date) : 'Выберите дату';
};

const validateTitle = () => {
  fieldErrors.title = form.title.trim() ? '' : 'Введите название поездки.';
};

const validateCity = () => {
  if (!form.cityQuery.trim()) {
    fieldErrors.city = 'Выберите город для поездки.';
    return;
  }

  if (!selectedCity.value) {
    fieldErrors.city = 'Выберите город из списка подсказок, чтобы сохранить координаты.';
    return;
  }

  fieldErrors.city = '';
};

const validateDateFrom = () => {
  fieldErrors.date_from = form.date_from ? '' : 'Укажите дату начала поездки.';

  if (form.date_to) {
    validateDateTo();
  }
};

const validateDateTo = () => {
  if (!form.date_to) {
    fieldErrors.date_to = 'Укажите дату окончания поездки.';
    return;
  }

  if (form.date_from && form.date_to < form.date_from) {
    fieldErrors.date_to = 'Дата окончания не может быть раньше даты начала.';
    return;
  }

  fieldErrors.date_to = '';
};

const validatePace = () => {
  fieldErrors.pace = form.pace ? '' : 'Выберите темп поездки.';
};

const validateForm = () => {
  validateTitle();
  validateCity();
  validateDateFrom();
  validateDateTo();
  validatePace();

  return Object.values(fieldErrors).every((value) => !value);
};

const hasDateRangeError = computed(() => (
  Boolean(form.date_from)
  && Boolean(form.date_to)
  && form.date_to < form.date_from
));

const isFormComplete = computed(() => (
  Boolean(form.title.trim())
  && Boolean(selectedCity.value)
  && Boolean(form.date_from)
  && Boolean(form.date_to)
  && !hasDateRangeError.value
  && Boolean(form.pace)
));

const submitDisabled = computed(() => isCreating.value || !isFormComplete.value);

const selectedPaceOption = computed(() => (
  paceOptions.find((option) => option.value === form.pace) ?? defaultPaceOption
));

const previewTitle = computed(() => form.title.trim() || 'Новая поездка');
const previewCity = computed(() => selectedCity.value?.city || 'Город не выбран');
const previewLocationNote = computed(() => (
  selectedCity.value?.displayName || 'Выберите город через поиск OpenStreetMap, чтобы подтянуть координаты.'
));

const previewDates = computed(() => (
  form.date_from && form.date_to
    ? `${formatDate(form.date_from)} - ${formatDate(form.date_to)}`
    : 'Выберите даты поездки'
));

const tripDaysCount = computed(() => {
  if (!form.date_from || !form.date_to || hasDateRangeError.value) {
    return null;
  }

  const dateFrom = parseDateString(form.date_from);
  const dateTo = parseDateString(form.date_to);

  if (!dateFrom || !dateTo) {
    return null;
  }

  const diffInMs = dateTo.getTime() - dateFrom.getTime();

  return Math.floor(diffInMs / 86400000) + 1;
});

const previewDays = computed(() => {
  if (!form.date_from || !form.date_to) {
    return 'Укажите диапазон дат, чтобы посчитать длительность.';
  }

  if (hasDateRangeError.value) {
    return 'Дата окончания должна быть не раньше даты начала.';
  }

  if (!tripDaysCount.value) {
    return 'Не удалось рассчитать длительность поездки.';
  }

  const mod10 = tripDaysCount.value % 10;
  const mod100 = tripDaysCount.value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${tripDaysCount.value} день поездки`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${tripDaysCount.value} дня поездки`;
  }

  return `${tripDaysCount.value} дней поездки`;
});

const resetApiError = () => {
  if (apiError.value) {
    tripsStore.clearError();
  }
};

const buildPayload = (): CreateTripPayload | null => {
  if (!selectedCity.value) {
    return null;
  }

  return {
    title: form.title.trim(),
    city: selectedCity.value.city,
    city_lat: selectedCity.value.lat,
    city_lng: selectedCity.value.lng,
    date_from: form.date_from,
    date_to: form.date_to,
    pace: form.pace,
  };
};

const handleSubmit = async () => {
  resetApiError();

  if (!validateForm()) {
    return;
  }

  const payload = buildPayload();

  if (!payload) {
    fieldErrors.city = 'Выберите город из списка подсказок, чтобы сохранить координаты.';
    return;
  }

  const createdTrip = await tripsStore.createTrip(payload);

  if (!createdTrip) {
    return;
  }

  await navigateTo(`/app/trips/${createdTrip.uuid}`, { replace: true });
};

watch(
  () => [form.title, form.cityQuery, form.date_from, form.date_to, form.pace, selectedCity.value?.city],
  () => {
    resetApiError();
  },
);

tripsStore.clearError();
</script>
