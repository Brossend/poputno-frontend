<template>
  <section id="features" class="bg-[#f7f6f3] py-20 sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <h2 class="text-4xl font-semibold text-slate-950">
          Всё для идеальной поездки
        </h2>
        <p class="mt-4 text-lg leading-8 text-slate-600">
          Попутно помогает собрать маршрут, распределить места по дням и не потерять важные детали поездки.
        </p>
      </div>

      <div class="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="rounded-3xl border border-[#e5e2dc] bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
        >
          <div class="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-[#3f6df6]">
            <svg
              aria-hidden="true"
              class="size-6"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path :d="feature.icon" />
            </svg>
          </div>

          <h3 class="mt-5 text-xl font-semibold text-slate-950">
            {{ feature.title }}
          </h3>
          <p class="mt-3 text-sm leading-6 text-slate-600">
            {{ feature.text }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    title: 'Карта и список в одном',
    text: 'Видите маршрут на карте и подробный список мест одновременно — ничего не упустите.',
    icon: 'M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z',
  },
  {
    title: 'Автоматический маршрут',
    text: 'Система помогает распределить места по дням и оптимизировать порядок посещения.',
    icon: 'M13 2 4 14h7l-1 8 10-13h-7l1-7Z',
  },
  {
    title: 'Поделитесь с друзьями',
    text: 'Отправьте публичную ссылку — друзья увидят маршрут без регистрации.',
    icon: 'M18 8a3 3 0 1 0-2.8-4M6 16a3 3 0 1 0 2.8 4M8.6 14.5l6.8 3M15.4 6.5l-6.8 3',
  },
  {
    title: 'Распределение по дням',
    text: 'Группируйте места по дням, меняйте порядок и управляйте темпом поездки.',
    icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  },
  {
    title: 'Тайминг и длительность',
    text: 'Указывайте время посещения и длительность — маршрут остаётся реалистичным.',
    icon: 'M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  {
    title: 'Любой город мира',
    text: 'Планируйте поездки по разным городам — от Москвы и Питера до Новосибирска и Хабаровска.',
    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
  },
];
</script>
