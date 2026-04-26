<template>
  <section
    class="flex min-h-screen flex-col justify-between overflow-hidden bg-cover bg-center px-12 py-10 text-white"
    :style="promoBackgroundStyle"
  >
    <div class="flex items-center gap-3">
      <div class="flex size-11 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-950/30">
        <svg
          aria-hidden="true"
          class="size-5"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="m15 9-2 6-4 2 2-6 4-2Z" />
        </svg>
      </div>

      <span class="text-base font-semibold tracking-wide">
        Попутно
      </span>
    </div>

    <div class="mb-6 max-w-xl">
      <h1 class="text-5xl font-semibold leading-[1.08] text-white">
        Планируй идеальный городской отпуск
      </h1>

      <p class="mt-6 text-lg leading-8 text-blue-100/85">
        Добавляй места, строй маршруты по дням и делись поездкой с друзьями — всё в одном месте.
      </p>

      <ul class="mt-10 space-y-4">
        <li
          v-for="benefit in benefits"
          :key="benefit.label"
          class="flex items-center gap-4 text-sm font-medium text-blue-50"
        >
          <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-400/15 text-blue-200 ring-1 ring-blue-200/15">
            <svg
              v-if="benefit.icon === 'pin'"
              aria-hidden="true"
              class="size-5"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20 10c0 4.7-8 11-8 11s-8-6.3-8-11a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>

            <svg
              v-else-if="benefit.icon === 'bolt'"
              aria-hidden="true"
              class="size-5"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z" />
            </svg>

            <svg
              v-else
              aria-hidden="true"
              class="size-5"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18" />
              <path d="M12 3a14 14 0 0 1 0 18" />
              <path d="M12 3a14 14 0 0 0 0 18" />
            </svg>
          </span>

          <span>{{ benefit.label }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import authBgUrl from '~/assets/images/maxresdefault.jpg';

const benefits: Array<{ icon: 'pin' | 'bolt' | 'globe'; label: string }> = [
  {
    icon: 'pin',
    label: 'Маршруты по дням с оптимизацией пути',
  },
  {
    icon: 'bolt',
    label: 'Автоматическое распределение мест',
  },
  {
    icon: 'globe',
    label: 'Публичная ссылка для друзей',
  },
];

const promoBackgroundStyle = {
  backgroundImage: `linear-gradient(180deg, rgba(5, 18, 38, 0.78), rgba(7, 20, 43, 0.94)), url("${authBgUrl}")`,
};
</script>
