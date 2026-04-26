<template>
  <main class="grid min-h-screen bg-[#f7f6f3] text-slate-950 lg:grid-cols-2">
    <div class="hidden min-h-screen lg:block">
      <AuthPromoPanel />
    </div>

    <div class="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-12">
      <AuthCard />
    </div>
  </main>
</template>

<script setup lang="ts">
import AuthCard from '~/components/auth/AuthCard.vue';
import AuthPromoPanel from '~/components/auth/AuthPromoPanel.vue';
</script>
