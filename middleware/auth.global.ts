import { useAuthStore } from '~/stores/auth';
import { resolveInternalRedirect } from '~/utils/navigation';

const AUTH_ROUTE = '/auth';
const APP_ROOT_ROUTE = '/app';
const APP_TRIPS_ROUTE = '/app/trips';
const LEGACY_HOME_ROUTE = '/home';

const isAppRoute = (path: string) => path === APP_ROOT_ROUTE || path.startsWith(`${APP_ROOT_ROUTE}/`);

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === LEGACY_HOME_ROUTE) {
    return navigateTo(APP_TRIPS_ROUTE, { replace: true });
  }

  if (to.path !== AUTH_ROUTE && !isAppRoute(to.path)) {
    return;
  }

  if (import.meta.server) {
    return;
  }

  const authStore = useAuthStore();

  if (!authStore.isInitialized) {
    await authStore.initialize();
  }

  if (to.path === AUTH_ROUTE) {
    if (authStore.user) {
      return navigateTo(resolveInternalRedirect(to.query.redirect, APP_TRIPS_ROUTE), { replace: true });
    }

    return;
  }

  if (!authStore.user) {
    return navigateTo(AUTH_ROUTE, { replace: true });
  }

  if (to.path === APP_ROOT_ROUTE) {
    return navigateTo(APP_TRIPS_ROUTE, { replace: true });
  }
});
