<template>
  <section id="how-it-works" class="bg-white py-20 sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-3xl text-center">
        <h2 class="text-4xl font-semibold text-slate-950">
          Три шага до идеального маршрута
        </h2>
        <p class="mt-4 text-lg leading-8 text-slate-600">
          От идеи до готового маршрута — меньше 10 минут. Мы берём рутину на себя.
        </p>
      </div>

      <div class="relative mt-14 grid gap-5 lg:grid-cols-3">
        <div class="pointer-events-none absolute left-1/2 top-10 hidden h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#3f6df6]/35 to-transparent lg:block" />

        <article
          v-for="step in steps"
          :key="step.number"
          class="relative rounded-3xl border border-[#e5e2dc] bg-[#f7f6f3] p-6"
        >
          <div class="flex size-14 items-center justify-center rounded-2xl bg-[#3f6df6] text-sm font-semibold text-white shadow-lg shadow-blue-600/20">
            {{ step.number }}
          </div>
          <h3 class="mt-6 text-xl font-semibold text-slate-950">
            {{ step.title }}
          </h3>
          <p class="mt-3 text-sm leading-6 text-slate-600">
            {{ step.text }}
          </p>
        </article>
      </div>

      <div class="mt-10 rounded-3xl border border-[#e5e2dc] bg-[#f7f6f3] p-6 sm:p-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <p class="max-w-md text-lg font-semibold text-slate-950">
            Выберите темп — и мы настроим количество мест в день:
          </p>

          <div class="grid gap-3 sm:grid-cols-3 lg:min-w-[600px]">
            <div
              v-for="pace in paces"
              :key="pace.title"
              class="rounded-2xl border border-[#e5e2dc] bg-white px-4 py-4"
            >
              <p class="text-sm font-semibold text-slate-950">
                {{ pace.title }}
              </p>
              <p class="mt-1 text-sm text-slate-500">
                {{ pace.value }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const steps = [
  {
    number: '01',
    title: 'Создайте поездку',
    text: 'Укажите город, даты и выберите темп — расслабленный, умеренный или интенсивный.',
  },
  {
    number: '02',
    title: 'Добавьте места',
    text: 'Ищите достопримечательности, кафе, парки и музеи. Добавляйте заметки и длительность.',
  },
  {
    number: '03',
    title: 'Постройте маршрут',
    text: 'Один клик — и система оптимизирует порядок мест по дням и выбранному транспорту.',
  },
];

const paces = [
  {
    title: 'Расслабленный',
    value: '2–3 места/день',
  },
  {
    title: 'Умеренный',
    value: '4–5 мест/день',
  },
  {
    title: 'Интенсивный',
    value: '6–8 мест/день',
  },
];
</script>
