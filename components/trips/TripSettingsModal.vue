<template>
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[1100] flex items-end justify-center bg-slate-950/45 p-4 sm:items-center"
      @click.self="closeModal"
    >
      <div class="w-full max-w-2xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.22)]">
        <div class="border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-slate-50 px-5 py-5 sm:px-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                Попутно
              </p>
              <h2 class="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Настройки поездки
              </h2>
              <p class="mt-2 text-sm leading-6 text-slate-500">
                Обновите основные параметры поездки. Изменённые поля отправятся на сервер одним PATCH-запросом.
              </p>
            </div>

            <button
              type="button"
              class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isSaving"
              aria-label="Закрыть настройки поездки"
              @click="closeModal"
            >
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 5 15 15" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
                <path d="M15 5 5 15" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
              </svg>
            </button>
          </div>
        </div>

        <form class="space-y-6 px-5 py-5 sm:px-6" @submit.prevent="handleSubmit">
          <div v-if="!trip" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            Детали поездки пока не загрузились. Откройте настройки ещё раз, когда данные будут доступны.
          </div>

          <div class="grid gap-5">
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-700" for="trip-settings-title">
                Название поездки
              </label>
              <input
                id="trip-settings-title"
                v-model="form.title"
                type="text"
                placeholder="Москва на выходные"
                class="h-12 w-full rounded-2xl border px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                :class="fieldErrors.title ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'"
                :disabled="isSaving || !trip"
              >
              <p v-if="fieldErrors.title" class="mt-2 text-sm text-rose-600">
                {{ fieldErrors.title }}
              </p>
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-slate-700">
                Город
              </label>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {{ trip?.city || 'Не указан' }}
              </div>
              <p class="mt-2 text-xs leading-5 text-slate-500">
                Повторный выбор города добавим следующим шагом. Сейчас город доступен только для просмотра.
              </p>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700" for="trip-settings-date-from">
                  Дата начала
                </label>
                <input
                  id="trip-settings-date-from"
                  v-model="form.dateFrom"
                  type="date"
                  class="h-12 w-full rounded-2xl border px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  :class="fieldErrors.dateFrom ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'"
                  :disabled="isSaving || !trip"
                >
                <p v-if="fieldErrors.dateFrom" class="mt-2 text-sm text-rose-600">
                  {{ fieldErrors.dateFrom }}
                </p>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700" for="trip-settings-date-to">
                  Дата окончания
                </label>
                <input
                  id="trip-settings-date-to"
                  v-model="form.dateTo"
                  type="date"
                  class="h-12 w-full rounded-2xl border px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  :class="fieldErrors.dateTo ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'"
                  :disabled="isSaving || !trip"
                >
                <p v-if="fieldErrors.dateTo" class="mt-2 text-sm text-rose-600">
                  {{ fieldErrors.dateTo }}
                </p>
              </div>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between gap-3">
                <label class="block text-sm font-medium text-slate-700">
                  Темп поездки
                </label>
                <p class="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Pace
                </p>
              </div>

              <div class="grid gap-3">
                <label
                  v-for="option in paceOptions"
                  :key="option.value"
                  class="flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition"
                  :class="form.pace === option.value ? 'border-blue-400 bg-blue-50 shadow-[0_12px_30px_rgba(37,99,235,0.10)]' : 'border-slate-200 bg-white hover:border-slate-300'"
                >
                  <input
                    v-model="form.pace"
                    type="radio"
                    name="trip-pace"
                    :value="option.value"
                    class="mt-1 h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                    :disabled="isSaving || !trip"
                  >
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-900">
                      {{ option.label }}
                    </p>
                    <p class="mt-1 text-sm leading-6 text-slate-500">
                      {{ option.description }}
                    </p>
                  </div>
                </label>
              </div>

              <p v-if="fieldErrors.pace" class="mt-2 text-sm text-rose-600">
                {{ fieldErrors.pace }}
              </p>
            </div>
          </div>

          <div v-if="submitError" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900">
            {{ submitError }}
          </div>

          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isSaving"
              @click="closeModal"
            >
              Отмена
            </button>

            <button
              type="submit"
              class="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.26)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
              :disabled="isSaving || !trip"
            >
              {{ isSaving ? 'Сохраняем...' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { Trip, TripPace, UpdateTripPayload } from '~/types/trip';

interface Props {
  modelValue: boolean;
  trip: Trip | null;
  isSaving: boolean;
  submitError: string | null;
}

interface FieldErrors {
  title: string;
  dateFrom: string;
  dateTo: string;
  pace: string;
}

interface FormState {
  title: string;
  dateFrom: string;
  dateTo: string;
  pace: TripPace;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'submit', payload: UpdateTripPayload): void;
}>();

const paceOptions: Array<{ value: TripPace; label: string; description: string }> = [
  {
    value: 'relaxed',
    label: 'Спокойный',
    description: 'Подходит для неторопливых прогулок и коротких планов на день.',
  },
  {
    value: 'moderate',
    label: 'Умеренный',
    description: 'Сбалансированный ритм поездки с несколькими точками в течение дня.',
  },
  {
    value: 'intensive',
    label: 'Интенсивный',
    description: 'Плотный график, если хочется посмотреть максимум мест за поездку.',
  },
];

const form = reactive<FormState>({
  title: '',
  dateFrom: '',
  dateTo: '',
  pace: 'moderate',
});

const fieldErrors = reactive<FieldErrors>({
  title: '',
  dateFrom: '',
  dateTo: '',
  pace: '',
});

const resetFieldErrors = () => {
  fieldErrors.title = '';
  fieldErrors.dateFrom = '';
  fieldErrors.dateTo = '';
  fieldErrors.pace = '';
};

const syncForm = () => {
  form.title = props.trip?.title ?? '';
  form.dateFrom = props.trip?.date_from ?? '';
  form.dateTo = props.trip?.date_to ?? '';
  form.pace = props.trip?.pace ?? 'moderate';
  resetFieldErrors();
};

watch(
  () => [props.modelValue, props.trip] as const,
  ([isOpen]) => {
    if (!isOpen) {
      return;
    }

    syncForm();
  },
  { immediate: true },
);

const closeModal = () => {
  if (props.isSaving) {
    return;
  }

  emit('update:modelValue', false);
};

const validate = () => {
  resetFieldErrors();

  const normalizedTitle = form.title.trim();

  if (!normalizedTitle) {
    fieldErrors.title = 'Введите название поездки.';
  }

  if (!form.dateFrom) {
    fieldErrors.dateFrom = 'Укажите дату начала поездки.';
  }

  if (!form.dateTo) {
    fieldErrors.dateTo = 'Укажите дату окончания поездки.';
  }

  if (form.dateFrom && form.dateTo && form.dateTo < form.dateFrom) {
    fieldErrors.dateTo = 'Дата окончания не может быть раньше даты начала.';
  }

  if (!form.pace) {
    fieldErrors.pace = 'Выберите темп поездки.';
  }

  return !fieldErrors.title && !fieldErrors.dateFrom && !fieldErrors.dateTo && !fieldErrors.pace;
};

const buildPayload = (): UpdateTripPayload => {
  if (!props.trip) {
    return {};
  }

  const payload: UpdateTripPayload = {};
  const normalizedTitle = form.title.trim();

  if (normalizedTitle !== props.trip.title) {
    payload.title = normalizedTitle;
  }

  if (form.dateFrom !== props.trip.date_from) {
    payload.date_from = form.dateFrom;
  }

  if (form.dateTo !== props.trip.date_to) {
    payload.date_to = form.dateTo;
  }

  if (form.pace !== props.trip.pace) {
    payload.pace = form.pace;
  }

  return payload;
};

const handleSubmit = () => {
  if (!props.trip || !validate()) {
    return;
  }

  const payload = buildPayload();

  if (!Object.keys(payload).length) {
    closeModal();
    return;
  }

  emit('submit', payload);
};
</script>
