<template>
  <section class="w-full max-w-[448px] rounded-2xl border border-[#e5e2dc] bg-white p-6 shadow-[0_24px_70px_rgba(31,41,55,0.10)] sm:p-8">
    <div class="mb-8">
      <h2 class="text-3xl font-semibold tracking-normal text-slate-950">
        {{ activeMode === 'login' ? 'Добро пожаловать!' : 'Создайте аккаунт' }}
      </h2>

      <p class="mt-3 text-sm leading-6 text-slate-500">
        {{ activeMode === 'login' ? 'Войдите, чтобы продолжить планировать' : 'Начните бесплатно и планируйте' }}
      </p>
    </div>

    <div class="mb-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
      <button
        type="button"
        class="rounded-lg px-3 py-2.5 text-sm font-medium transition"
        :class="activeMode === 'login' ? activeTabClass : inactiveTabClass"
        @click="authStore.setMode('login')"
      >
        Войти
      </button>

      <button
        type="button"
        class="rounded-lg px-3 py-2.5 text-sm font-medium transition"
        :class="activeMode === 'register' ? activeTabClass : inactiveTabClass"
        @click="authStore.setMode('register')"
      >
        Регистрация
      </button>
    </div>

    <LoginForm v-if="activeMode === 'login'" />
    <RegisterForm v-else />
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import LoginForm from '~/components/auth/LoginForm.vue';
import RegisterForm from '~/components/auth/RegisterForm.vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const { activeMode } = storeToRefs(authStore);

const activeTabClass = 'bg-white text-slate-950 shadow-sm';
const inactiveTabClass = 'text-slate-500 hover:text-slate-800';
</script>
