import type { ApiValidationError } from '~/types/auth';

interface NormalizedApiError {
  message: string;
  status: number | null;
}

const getStatus = (error: unknown): number | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const candidate = error as { status?: unknown; statusCode?: unknown; response?: { status?: unknown } };
  const status = candidate.statusCode ?? candidate.status ?? candidate.response?.status;

  return typeof status === 'number' ? status : null;
};

const firstString = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = firstString(item);

      if (result) {
        return result;
      }
    }
  }

  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      const result = firstString(item);

      if (result) {
        return result;
      }
    }
  }

  return null;
};

const getData = (error: unknown): ApiValidationError | string | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const candidate = error as { data?: unknown; response?: { _data?: unknown; data?: unknown } };
  const data = candidate.data ?? candidate.response?._data ?? candidate.response?.data;

  if (typeof data === 'string') {
    return data;
  }

  return data && typeof data === 'object' ? (data as ApiValidationError) : null;
};

export const normalizeApiError = (error: unknown, fallback: string): NormalizedApiError => {
  const data = getData(error);
  const status = getStatus(error);
  const dataMessage = typeof data === 'string'
    ? firstString(data)
    : data
      ? firstString(data.message) ?? firstString(data.errors)
      : null;

  if (dataMessage) {
    return {
      message: dataMessage,
      status,
    };
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = firstString((error as { message?: unknown }).message);

    if (message && !message.includes('\n')) {
      return {
        message,
        status,
      };
    }
  }

  return {
    message: fallback,
    status,
  };
};
