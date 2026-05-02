import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useApiClient } from '~/composables/useApiClient';
import type {
  AuthMode,
  AuthResponse,
  LoginPayload,
  LogoutResponse,
  MeResponse,
  RefreshResponse,
  RegisterPayload,
  User,
} from '~/types/auth';
import { normalizeApiError } from '~/utils/apiError';

const isUser = (value: unknown): value is User => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<User>;

  return (
    typeof candidate.uuid === 'string'
    && typeof candidate.email === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.created_at === 'string'
  );
};

export const useAuthStore = defineStore('auth', () => {
  const { apiFetch } = useApiClient();

  const activeMode = ref<AuthMode>('login');
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const isInitialized = ref(false);
  const error = ref<string | null>(null);
  const initializationPromise = ref<Promise<User | null> | null>(null);
  const refreshPromise = ref<Promise<RefreshResponse | null> | null>(null);

  const isAuthenticated = computed(() => Boolean(user.value));

  const setMode = (mode: AuthMode) => {
    activeMode.value = mode;
    error.value = null;
  };

  const clearError = () => {
    error.value = null;
  };

  const refresh = async (): Promise<RefreshResponse | null> => {
    if (refreshPromise.value) {
      return refreshPromise.value;
    }

    refreshPromise.value = (async () => {
      try {
        const response = await apiFetch<RefreshResponse>('/auth/refresh', {
          method: 'POST',
        });

        clearError();

        return response;
      } catch (requestError) {
        const normalized = normalizeApiError(requestError, 'Не удалось обновить сессию.');

        if (normalized.status === 401) {
          user.value = null;
          clearError();
        } else {
          error.value = normalized.message;
        }

        return null;
      } finally {
        refreshPromise.value = null;
      }
    })();

    return refreshPromise.value;
  };

  const fetchMe = async (): Promise<User | null> => {
    isLoading.value = true;

    try {
      const requestUser = async () => apiFetch<MeResponse>('/auth/me', {
        method: 'GET',
      });

      try {
        const response = await requestUser();

        user.value = response;
        clearError();

        return response;
      } catch (requestError) {
        const normalized = normalizeApiError(requestError, 'Не удалось получить данные пользователя.');

        if (normalized.status === 401) {
          const refreshResponse = await refresh();

          if (refreshResponse) {
            const retryResponse = await requestUser();

            user.value = retryResponse;
            clearError();

            return retryResponse;
          }
        }

        throw requestError;
      }
    } catch (requestError) {
      const normalized = normalizeApiError(requestError, 'Не удалось получить данные пользователя.');

      if (normalized.status === 401 || normalized.status === 404) {
        user.value = null;
        clearError();
      } else {
        user.value = null;
        error.value = normalized.message;
      }

      return null;
    } finally {
      isInitialized.value = true;
      isLoading.value = false;
    }
  };

  const initialize = async (): Promise<User | null> => {
    if (isInitialized.value) {
      return user.value;
    }

    if (initializationPromise.value) {
      return initializationPromise.value;
    }

    initializationPromise.value = fetchMe().finally(() => {
      initializationPromise.value = null;
    });

    return initializationPromise.value;
  };

  const resolveAuthenticatedUser = async (candidate: unknown): Promise<User | null> => {
    if (isUser(candidate)) {
      user.value = candidate;
      isInitialized.value = true;
      clearError();
      return candidate;
    }

    const fetchedUser = await fetchMe();

    if (fetchedUser) {
      return fetchedUser;
    }

    return null;
  };

  const login = async (payload: LoginPayload): Promise<AuthResponse | null> => {
    isLoading.value = true;
    clearError();

    try {
      const response = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: payload,
      });

      const authenticatedUser = await resolveAuthenticatedUser(response.user);

      if (!authenticatedUser) {
        error.value = 'Вход выполнен, но не удалось подтвердить сессию. Попробуйте ещё раз.';
        return null;
      }

      return response;
    } catch (requestError) {
      const normalized = normalizeApiError(requestError, 'Не удалось войти. Попробуйте позже.');

      if (normalized.status === 401) {
        error.value = 'Неверный email или пароль.';
      } else if (normalized.status === 422) {
        error.value = normalized.message;
      } else {
        error.value = 'Не удалось войти. Попробуйте позже.';
      }

      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (payload: RegisterPayload): Promise<AuthResponse | null> => {
    isLoading.value = true;
    clearError();

    try {
      const response = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: payload,
      });

      const authenticatedUser = await resolveAuthenticatedUser(response.user);

      if (!authenticatedUser) {
        const loginResponse = await login({
          email: payload.email,
          password: payload.password,
        });

        return loginResponse;
      }

      return response;
    } catch (requestError) {
      const normalized = normalizeApiError(requestError, 'Не удалось создать аккаунт. Попробуйте позже.');

      if (normalized.status === 409) {
        error.value = 'Email уже занят.';
      } else if (normalized.status === 422) {
        error.value = normalized.message;
      } else {
        error.value = 'Не удалось создать аккаунт. Попробуйте позже.';
      }

      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async (): Promise<LogoutResponse | null> => {
    isLoading.value = true;
    clearError();

    try {
      const response = await apiFetch<LogoutResponse>('/auth/logout', {
        method: 'POST',
      });

      user.value = null;
      isInitialized.value = true;
      clearError();

      return response;
    } catch (requestError) {
      const normalized = normalizeApiError(requestError, 'Не удалось выйти. Попробуйте позже.');

      user.value = null;
      isInitialized.value = true;
      error.value = normalized.message;

      return null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    activeMode,
    user,
    isLoading,
    isInitialized,
    error,
    isAuthenticated,
    setMode,
    clearError,
    login,
    register,
    logout,
    refresh,
    fetchMe,
    initialize,
  };
});
