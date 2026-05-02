import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useApiClient } from '~/composables/useApiClient';
import type { CreateTripPayload, Trip, TripCreateResult, TripListItem, TripPace, TripShareResult, UpdateTripPayload } from '~/types/trip';
import { normalizeApiError } from '~/utils/apiError';

type TripListResponse =
  | TripListItem[]
  | Trip[]
  | {
    items?: unknown;
    results?: unknown;
    data?: unknown;
  };

type TripResponse =
  | Trip
  | null
  | {
    trip?: unknown;
    result?: unknown;
    data?: unknown;
  };

type CreateTripResponse =
  | Trip
  | TripCreateResult
  | null
  | {
    uuid?: unknown;
    trip?: unknown;
    result?: unknown;
    data?: unknown;
  };

type ShareTripResponse =
  | Trip
  | TripShareResult
  | null
  | {
    uuid?: unknown;
    share_slug?: unknown;
    share_url?: unknown;
    url?: unknown;
    link?: unknown;
    trip?: unknown;
    result?: unknown;
    data?: unknown;
  };

const TRIP_PACES: TripPace[] = ['relaxed', 'moderate', 'intensive'];

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isOptionalNumber = (value: unknown): value is number | undefined => (
  value === undefined || typeof value === 'number'
);

const isOptionalString = (value: unknown): value is string | undefined => (
  value === undefined || typeof value === 'string'
);

const isNullableString = (value: unknown): value is string | null => (
  value === null || typeof value === 'string'
);

const isOptionalNullableString = (value: unknown): value is string | null | undefined => (
  value === undefined || value === null || typeof value === 'string'
);

const isTripPace = (value: unknown): value is TripPace => (
  typeof value === 'string' && TRIP_PACES.includes(value as TripPace)
);

const normalizeTripListItem = (value: unknown): TripListItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.uuid !== 'string'
    || typeof value.title !== 'string'
    || typeof value.city !== 'string'
    || typeof value.date_from !== 'string'
    || typeof value.date_to !== 'string'
    || typeof value.created_at !== 'string'
  ) {
    return null;
  }

  const placesCount = typeof value.places_count === 'number' ? value.places_count : 0;

  return {
    uuid: value.uuid,
    title: value.title,
    city: value.city,
    date_from: value.date_from,
    date_to: value.date_to,
    places_count: placesCount,
    created_at: value.created_at,
  };
};

const isTrip = (value: unknown): value is Trip => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.uuid === 'string'
    && typeof value.title === 'string'
    && typeof value.city === 'string'
    && typeof value.date_from === 'string'
    && typeof value.date_to === 'string'
    && typeof value.created_at === 'string'
    && isTripPace(value.pace)
    && isOptionalNumber(value.city_lat)
    && isOptionalNumber(value.city_lng)
    && isOptionalNullableString(value.share_slug)
    && isOptionalString(value.updated_at)
    && isOptionalNumber(value.days_count)
    && isOptionalNumber(value.places_count)
  );
};

const extractTripList = (payload: TripListResponse): TripListItem[] => {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.results)
        ? payload.results
        : Array.isArray(payload.data)
          ? payload.data
          : [];

  return source
    .map(normalizeTripListItem)
    .filter((item): item is TripListItem => item !== null);
};

const extractTrip = (payload: TripResponse): Trip | null => {
  if (payload === null) {
    return null;
  }

  if (isTrip(payload)) {
    return payload;
  }

  if (isRecord(payload)) {
    const candidates = [payload.trip, payload.result, payload.data];

    for (const candidate of candidates) {
      if (candidate === null) {
        return null;
      }

      if (isTrip(candidate)) {
        return candidate;
      }
    }
  }

  return null;
};

const extractTripCreateResult = (payload: CreateTripResponse): TripCreateResult | null => {
  const trip = extractTrip(payload as TripResponse);

  if (trip) {
    return { uuid: trip.uuid };
  }

  if (payload === null) {
    return null;
  }

  if (isRecord(payload)) {
    if (typeof payload.uuid === 'string') {
      return { uuid: payload.uuid };
    }

    const candidates = [payload.trip, payload.result, payload.data];

    for (const candidate of candidates) {
      if (isRecord(candidate) && typeof candidate.uuid === 'string') {
        return { uuid: candidate.uuid };
      }
    }
  }

  return null;
};

const pickFirstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return null;
};

const extractTripShareResult = (payload: ShareTripResponse): TripShareResult | null => {
  const trip = extractTrip(payload as TripResponse);

  if (trip) {
    return {
      uuid: trip.uuid,
      share_slug: trip.share_slug ?? null,
      share_url: trip.share_slug ? null : null,
    };
  }

  if (payload === null) {
    return null;
  }

  if (!isRecord(payload)) {
    return null;
  }

  const candidates = [payload, payload.trip, payload.result, payload.data].filter(isRecord);

  for (const candidate of candidates) {
    const uuid = pickFirstString(candidate.uuid);
    const shareSlug = pickFirstString(candidate.share_slug, candidate.slug);
    const shareUrl = pickFirstString(candidate.share_url, candidate.url, candidate.link);

    if (uuid || shareSlug || shareUrl) {
      return {
        uuid: uuid ?? null,
        share_slug: isNullableString(shareSlug) ? shareSlug : null,
        share_url: isNullableString(shareUrl) ? shareUrl : null,
      };
    }
  }

  return null;
};

const toTripListItem = (trip: Trip): TripListItem => ({
  uuid: trip.uuid,
  title: trip.title,
  city: trip.city,
  date_from: trip.date_from,
  date_to: trip.date_to,
  places_count: trip.places_count ?? 0,
  created_at: trip.created_at,
});

const mergeTripWithPayload = (trip: Trip, payload: UpdateTripPayload): Trip => ({
  ...trip,
  title: payload.title ?? trip.title,
  city: payload.city ?? trip.city,
  city_lat: payload.city_lat === null ? undefined : payload.city_lat ?? trip.city_lat,
  city_lng: payload.city_lng === null ? undefined : payload.city_lng ?? trip.city_lng,
  date_from: payload.date_from ?? trip.date_from,
  date_to: payload.date_to ?? trip.date_to,
  pace: payload.pace ?? trip.pace,
  updated_at: new Date().toISOString(),
});

const getTripsErrorMessage = (error: unknown, fallback: string): string => {
  const normalized = normalizeApiError(error, fallback);

  if (normalized.status === 401) {
    return 'Сессия истекла. Войдите снова, чтобы продолжить работу в Попутно.';
  }

  if (normalized.status === 403) {
    return 'Нет прав на редактирование этой поездки.';
  }

  if (normalized.status === 404) {
    return 'Поездка не найдена или уже была удалена.';
  }

  if (normalized.status === 422) {
    return normalized.message || 'Проверьте введённые данные поездки.';
  }

  return normalized.message || fallback;
};

export const useTripsStore = defineStore('trips', () => {
  const { apiFetch } = useApiClient();

  const trips = ref<TripListItem[]>([]);
  const currentTrip = ref<Trip | null>(null);
  const isLoading = ref(false);
  const isCreating = ref(false);
  const isSharing = ref(false);
  const error = ref<string | null>(null);

  const clearError = () => {
    error.value = null;
  };

  const upsertTripInList = (trip: Trip) => {
    const listItem = toTripListItem(trip);
    const existingIndex = trips.value.findIndex((item) => item.uuid === trip.uuid);

    if (existingIndex === -1) {
      trips.value = [listItem, ...trips.value];
      return;
    }

    const nextTrips = [...trips.value];
    nextTrips.splice(existingIndex, 1, listItem);
    trips.value = nextTrips;
  };

  const fetchTrips = async (params?: { limit?: number; offset?: number }): Promise<TripListItem[]> => {
    isLoading.value = true;
    clearError();

    try {
      const response = await apiFetch<TripListResponse>('/trips/', {
        method: 'GET',
        query: params,
      });

      const normalizedTrips = extractTripList(response);

      if (!normalizedTrips.length && Array.isArray(response) && response.length > 0) {
        error.value = 'Список поездок получен в неожиданном формате. Попробуйте обновить страницу позже.';
      }

      trips.value = normalizedTrips;

      return normalizedTrips;
    } catch (requestError) {
      trips.value = [];
      error.value = getTripsErrorMessage(requestError, 'Не удалось загрузить список поездок.');

      return [];
    } finally {
      isLoading.value = false;
    }
  };

  const fetchTrip = async (tripId: string): Promise<Trip | null> => {
    isLoading.value = true;
    clearError();
    currentTrip.value = null;

    try {
      const response = await apiFetch<TripResponse>(`/trips/${encodeURIComponent(tripId)}`, {
        method: 'GET',
      });

      const normalizedTrip = extractTrip(response);

      if (!normalizedTrip) {
        error.value = 'Детали поездки пока недоступны. Попробуйте открыть её позже.';
        return null;
      }

      currentTrip.value = normalizedTrip;
      upsertTripInList(normalizedTrip);

      return normalizedTrip;
    } catch (requestError) {
      error.value = getTripsErrorMessage(requestError, 'Не удалось загрузить поездку.');

      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const createTrip = async (payload: CreateTripPayload): Promise<TripCreateResult | null> => {
    isCreating.value = true;
    clearError();

    try {
      const response = await apiFetch<CreateTripResponse>('/trips/', {
        method: 'POST',
        body: payload,
      });

      const normalizedTrip = extractTrip(response as TripResponse);
      const createdTrip = extractTripCreateResult(response);

      if (!createdTrip) {
        error.value = 'Поездка создана, но ответ сервера пришёл в неполном формате.';
        return null;
      }

      if (normalizedTrip) {
        currentTrip.value = normalizedTrip;
        upsertTripInList(normalizedTrip);
      }

      return createdTrip;
    } catch (requestError) {
      error.value = getTripsErrorMessage(requestError, 'Не удалось создать поездку.');

      return null;
    } finally {
      isCreating.value = false;
    }
  };

  const updateTrip = async (tripId: string, payload: UpdateTripPayload): Promise<Trip | null> => {
    isLoading.value = true;
    clearError();

    try {
      const response = await apiFetch<TripResponse>(`/trips/${encodeURIComponent(tripId)}`, {
        method: 'PATCH',
        body: payload,
      });

      const normalizedTrip = extractTrip(response);
      const fallbackTrip = currentTrip.value?.uuid === tripId
        ? mergeTripWithPayload(currentTrip.value, payload)
        : null;

      if (!normalizedTrip && !fallbackTrip) {
        error.value = 'Изменения сохранены, но обновлённые данные поездки пока недоступны.';
        return null;
      }

      const nextTrip = normalizedTrip ?? fallbackTrip;

      if (!nextTrip) {
        return null;
      }

      currentTrip.value = nextTrip;
      upsertTripInList(nextTrip);

      return nextTrip;
    } catch (requestError) {
      error.value = getTripsErrorMessage(requestError, 'Не удалось обновить поездку.');

      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteTrip = async (tripId: string): Promise<boolean> => {
    isLoading.value = true;
    clearError();

    try {
      await apiFetch<void>(`/trips/${encodeURIComponent(tripId)}`, {
        method: 'DELETE',
      });

      trips.value = trips.value.filter((trip) => trip.uuid !== tripId);

      if (currentTrip.value?.uuid === tripId) {
        currentTrip.value = null;
      }

      return true;
    } catch (requestError) {
      error.value = getTripsErrorMessage(requestError, 'Не удалось удалить поездку.');

      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const shareTrip = async (tripId: string): Promise<TripShareResult | null> => {
    isSharing.value = true;
    clearError();

    try {
      const response = await apiFetch<ShareTripResponse>(`/trips/${encodeURIComponent(tripId)}/share`, {
        method: 'POST',
      });

      const normalizedTrip = extractTrip(response as TripResponse);
      const shareResult = extractTripShareResult(response);

      if (normalizedTrip) {
        currentTrip.value = normalizedTrip;
        upsertTripInList(normalizedTrip);
      } else if (shareResult?.share_slug && currentTrip.value?.uuid === tripId) {
        currentTrip.value = {
          ...currentTrip.value,
          share_slug: shareResult.share_slug,
        };
      }

      if (!shareResult) {
        error.value = 'Ссылка для поездки создана, но ответ сервера пришёл в неполном формате.';
        return null;
      }

      return shareResult;
    } catch (requestError) {
      const normalized = normalizeApiError(requestError, 'Не удалось подготовить ссылку на поездку.');

      if (normalized.status === 401) {
        error.value = 'Сессия истекла. Войдите снова, чтобы поделиться поездкой.';
      } else if (normalized.status === 403) {
        error.value = 'Нет прав на редактирование этой поездки.';
      } else if (normalized.status === 404) {
        error.value = 'Backend пока не отдает POST /trips/{trip_id}/share: сейчас этот endpoint отвечает 404.';
      } else if (normalized.status === 422) {
        error.value = normalized.message || 'Не удалось поделиться поездкой из-за ошибки валидации.';
      } else {
        error.value = normalized.message || 'Не удалось подготовить ссылку на поездку.';
      }

      return null;
    } finally {
      isSharing.value = false;
    }
  };

  return {
    trips,
    currentTrip,
    isLoading,
    isCreating,
    isSharing,
    error,
    fetchTrips,
    fetchTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    shareTrip,
    clearError,
  };
});
