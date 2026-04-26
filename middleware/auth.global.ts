import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/stores/auth';

const PUBLIC_ROUTES = ['/auth'];

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();
  const { isAuthenticated, isInitialized } = storeToRefs(authStore);
  const isPublicRoute = PUBLIC_ROUTES.includes(to.path);

  if (!isInitialized.value || !isPublicRoute) {
    await authStore.fetchMe();
  }

  if (isAuthenticated.value && to.path === '/auth') {
    return navigateTo('/home');
  }

  if (isAuthenticated.value && to.path === '/') {
    return navigateTo('/home');
  }

  if (!isAuthenticated.value && !isPublicRoute) {
    return navigateTo('/auth');
  }
});
