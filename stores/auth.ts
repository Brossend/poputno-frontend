import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useApiClient } from '~/composables/useApiClient';
import type {
  AuthMode,
  AuthResponse,
  LoginPayload,
  LogoutResponse,
  MeResponse,
  RegisterPayload,
  User,
} from '~/types/auth';
import { normalizeApiError } from '~/utils/apiError';

export const useAuthStore = defineStore('auth', () => {
  const activeMode = ref<AuthMode>('login');
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isInitialized = ref(false);

  const isAuthenticated = computed(() => Boolean(user.value));

  const setMode = (mode: AuthMode) => {
    activeMode.value = mode;
    error.value = null;
  };

  const clearError = () => {
    error.value = null;
  };

  const login = async (payload: LoginPayload): Promise<AuthResponse | null> => {
    const { apiFetch } = useApiClient();

    isLoading.value = true;
    clearError();

    try {
      const response = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: payload,
      });

      user.value = response.user;

      return response;
    } catch (requestError) {
      const normalized = normalizeApiError(requestError, 'Не удалось войти. Попробуйте позже');

      if (normalized.status === 401) {
        error.value = 'Неверный email или пароль';
      } else if (normalized.status === 422) {
        error.value = normalized.message;
      } else {
        error.value = 'Не удалось войти. Попробуйте позже';
      }

      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (payload: RegisterPayload): Promise<AuthResponse | null> => {
    const { apiFetch } = useApiClient();

    isLoading.value = true;
    clearError();

    try {
      const response = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: payload,
      });

      user.value = response.user;

      return response;
    } catch (requestError) {
      const normalized = normalizeApiError(requestError, 'Не удалось создать аккаунт. Попробуйте позже');

      if (normalized.status === 409) {
        error.value = 'Email уже занят';
      } else if (normalized.status === 422) {
        error.value = normalized.message;
      } else {
        error.value = 'Не удалось создать аккаунт. Попробуйте позже';
      }

      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async (): Promise<LogoutResponse | null> => {
    const { apiFetch } = useApiClient();

    isLoading.value = true;
    clearError();

    try {
      const response = await apiFetch<LogoutResponse>('/auth/logout', {
        method: 'POST',
      });

      user.value = null;
      isInitialized.value = true;

      return response;
    } catch (requestError) {
      const normalized = normalizeApiError(requestError, 'Не удалось выйти. Попробуйте позже');

      user.value = null;
      isInitialized.value = true;
      error.value = normalized.message;

      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchMe = async (): Promise<User | null> => {
    const { apiFetch } = useApiClient();

    try {
      const response = await apiFetch<MeResponse>('/auth/me', {
        method: 'GET',
      });

      user.value = response;
      clearError();

      return response;
    } catch (requestError) {
      const normalized = normalizeApiError(requestError, 'Не удалось получить данные пользователя');

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
    }
  };

  return {
    activeMode,
    user,
    isLoading,
    error,
    isInitialized,
    isAuthenticated,
    setMode,
    clearError,
    login,
    register,
    logout,
    fetchMe,
  };
});
