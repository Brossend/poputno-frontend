<template>
  <Teleport to="body">
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
        class="fixed inset-0 z-[1150] flex items-end justify-center bg-slate-950/50 p-4 sm:items-center"
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
                  Ссылка на поездку
                </h2>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  Ссылку можно сразу скопировать кнопкой ниже или вручную из поля.
                </p>
              </div>

              <button
                type="button"
                class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                aria-label="Закрыть модалку со ссылкой"
                @click="closeModal"
              >
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 5 15 15" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
                  <path d="M15 5 5 15" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
                </svg>
              </button>
            </div>
          </div>

          <div class="space-y-5 px-5 py-5 sm:px-6">
            <p v-if="message" class="rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm leading-6 text-slate-700">
              {{ message }}
            </p>

            <p
              v-if="copyFeedback"
              class="rounded-2xl border px-4 py-3 text-sm leading-6"
              :class="copyFeedbackTone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-900'"
            >
              {{ copyFeedback }}
            </p>

            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <textarea
                ref="textAreaRef"
                :value="link"
                :placeholder="link ? '' : 'Ссылка пока не готова'"
                readonly
                rows="5"
                class="w-full resize-none bg-transparent text-sm leading-6 text-slate-700 outline-none"
                @focus="selectAll"
                @click="selectAll"
              />
            </div>

            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                class="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                @click="closeModal"
              >
                Закрыть
              </button>

              <button
                type="button"
                class="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.26)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
                :disabled="!link"
                @click="handleCopy"
              >
                Скопировать ссылку
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

interface Props {
  modelValue: boolean;
  link: string;
  message?: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
}>();

const textAreaRef = ref<HTMLTextAreaElement | null>(null);
const copyFeedback = ref<string | null>(null);
const copyFeedbackTone = ref<'success' | 'warning'>('success');

const selectAll = () => {
  textAreaRef.value?.focus();
  textAreaRef.value?.select();
};

const closeModal = () => {
  emit('update:modelValue', false);
};

const handleCopy = async () => {
  if (!props.link || !import.meta.client) {
    copyFeedback.value = 'Ссылка ещё не готова.';
    copyFeedbackTone.value = 'warning';
    return;
  }

  selectAll();

  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error('Clipboard API is unavailable.');
    }

    await navigator.clipboard.writeText(props.link);
    copyFeedback.value = 'Ссылка скопирована в буфер обмена.';
    copyFeedbackTone.value = 'success';
    return;
  } catch {
    try {
      const copied = window.document.execCommand('copy');

      if (copied) {
        copyFeedback.value = 'Ссылка скопирована в буфер обмена.';
        copyFeedbackTone.value = 'success';
        return;
      }
    } catch {
      // Keep the manual-copy guidance below.
    }
  }

  copyFeedback.value = 'Автокопирование не сработало. Ссылка уже выделена в поле выше, её можно скопировать вручную.';
  copyFeedbackTone.value = 'warning';
};

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) {
      return;
    }

    copyFeedback.value = null;
    await nextTick();
    selectAll();
  },
);

watch(
  () => props.link,
  async () => {
    if (!props.modelValue) {
      return;
    }

    copyFeedback.value = null;
    await nextTick();
    selectAll();
  },
);
</script>
