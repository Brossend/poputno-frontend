<template>
  <header class="sticky top-0 z-40 border-b border-white/20 bg-[#07142b]/85 backdrop-blur-xl">
    <div class="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <NuxtLink to="/" class="flex items-center gap-3">
        <span class="flex size-11 items-center justify-center rounded-2xl bg-[#3f6df6] text-white shadow-lg shadow-blue-950/30">
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
        </span>

        <span class="text-base font-semibold text-white">
          Попутно
        </span>
      </NuxtLink>

      <nav class="hidden items-center gap-8 text-sm font-medium text-blue-100/80 md:flex">
        <a class="transition hover:text-white" href="#features">Возможности</a>
        <a class="transition hover:text-white" href="#how-it-works">Как работает</a>
      </nav>

      <div class="flex items-center gap-2 sm:gap-3">
        <NuxtLink
          to="/auth"
          class="hidden rounded-xl px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-white/10 hover:text-white sm:inline-flex"
        >
          Войти
        </NuxtLink>

        <NuxtLink
          to="/auth?mode=register"
          class="inline-flex h-10 items-center justify-center rounded-xl bg-[#3f6df6] px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/25 transition hover:bg-[#315fe0]"
        >
          Начать бесплатно
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
