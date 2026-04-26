<template>
  <section class="bg-[#07142b] px-4 py-20 text-white sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-12 text-center shadow-2xl shadow-blue-950/25 sm:px-10">
      <div class="mx-auto flex size-16 items-center justify-center rounded-3xl bg-[#3f6df6] text-white shadow-xl shadow-blue-950/30">
        <svg
          aria-hidden="true"
          class="size-8"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="m4.9 4.9 2.8 2.8" />
          <path d="m16.3 16.3 2.8 2.8" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="m4.9 19.1 2.8-2.8" />
          <path d="m16.3 7.7 2.8-2.8" />
        </svg>
      </div>

      <h2 class="mx-auto mt-7 max-w-3xl text-4xl font-semibold leading-tight text-white">
        Готовы спланировать свою следующую поездку?
      </h2>
      <p class="mx-auto mt-4 max-w-2xl text-lg leading-8 text-blue-100/75">
        Создайте аккаунт и соберите первый городской маршрут бесплатно.
      </p>

      <div class="mt-8 flex flex-col justify-center gap-3 text-sm font-medium text-blue-100/85 sm:flex-row">
        <span>Бесплатно навсегда</span>
        <span class="hidden text-blue-300/50 sm:inline">·</span>
        <span>Без кредитной карты</span>
        <span class="hidden text-blue-300/50 sm:inline">·</span>
        <span>Готово за 5 минут</span>
      </div>

      <div class="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <NuxtLink
          to="/auth?mode=register"
          class="inline-flex h-12 items-center justify-center rounded-2xl bg-[#3f6df6] px-6 text-sm font-semibold text-white shadow-xl shadow-blue-950/30 transition hover:bg-[#315fe0]"
        >
          Создать аккаунт бесплатно
        </NuxtLink>

        <NuxtLink
          to="/auth"
          class="inline-flex h-12 items-center justify-center rounded-2xl border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Уже есть аккаунт? Войти
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
