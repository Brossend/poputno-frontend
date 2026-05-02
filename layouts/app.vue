<template>
  <div class="min-h-screen bg-[#f6f1e8] text-slate-950">
    <AppHeader />

    <div class="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <AppSidebar />

      <main class="min-w-0 flex-1">
        <div class="rounded-[32px] border border-[#e5ddd2] bg-white/85 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.09)] backdrop-blur sm:p-6 lg:p-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
