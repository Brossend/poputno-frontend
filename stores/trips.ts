import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useApiClient } from '~/composables/useApiClient';
import type {
  CreateTripPayload,
  Trip,
  TripCreateResult,
  TripListItem,
  TripPace,
  TripShareResult,
  UpdateTripPayload,
} from '~/types/trip';
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
const TRIPS_STORAGE_KEY = 'poputno.trips';
const TRIPS_REQUEST_TIMEOUT_MS = 3000;
const SHARE_REQUEST_TIMEOUT_MS = 2500;

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

  return {
    uuid: value.uuid,
    title: value.title,
    city: value.city,
    date_from: value.date_from,
    date_to: value.date_to,
    places_count: typeof value.places_count === 'number' ? value.places_count : 0,
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

  if (!isRecord(payload)) {
    return null;
  }

  for (const candidate of [payload.trip, payload.result, payload.data]) {
    if (candidate === null) {
      return null;
    }

    if (isTrip(candidate)) {
      return candidate;
    }
  }

  return null;
};

const extractTripCreateResult = (payload: CreateTripResponse): TripCreateResult | null => {
  const trip = extractTrip(payload as TripResponse);

  if (trip) {
    return { uuid: trip.uuid };
  }

  if (payload === null || !isRecord(payload)) {
    return null;
  }

  if (typeof payload.uuid === 'string') {
    return { uuid: payload.uuid };
  }

  for (const candidate of [payload.trip, payload.result, payload.data]) {
    if (isRecord(candidate) && typeof candidate.uuid === 'string') {
      return { uuid: candidate.uuid };
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
      share_url: null,
    };
  }

  if (payload === null || !isRecord(payload)) {
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

const createTripFromPayload = (uuid: string, payload: CreateTripPayload): Trip => {
  const timestamp = new Date().toISOString();

  return {
    uuid,
    title: payload.title,
    city: payload.city,
    city_lat: payload.city_lat,
    city_lng: payload.city_lng,
    date_from: payload.date_from,
    date_to: payload.date_to,
    pace: payload.pace,
    share_slug: null,
    created_at: timestamp,
    updated_at: timestamp,
    places_count: 0,
  };
};

const createTripFromListItem = (
  listItem: TripListItem,
  fallback?: Partial<Trip> | null,
): Trip => ({
  uuid: listItem.uuid,
  title: listItem.title,
  city: listItem.city,
  city_lat: fallback?.city_lat,
  city_lng: fallback?.city_lng,
  date_from: listItem.date_from,
  date_to: listItem.date_to,
  pace: fallback?.pace ?? 'moderate',
  share_slug: fallback?.share_slug ?? null,
  created_at: listItem.created_at,
  updated_at: fallback?.updated_at,
  days_count: fallback?.days_count,
  places_count: typeof fallback?.places_count === 'number' ? fallback.places_count : listItem.places_count,
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
    return normalized.message || 'Проверьте введенные данные поездки.';
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

  const canUseStorage = () => import.meta.client && typeof window !== 'undefined';

  const readStoredTrips = (): Trip[] => {
    if (!canUseStorage()) {
      return [];
    }

    try {
      const rawValue = window.localStorage.getItem(TRIPS_STORAGE_KEY);

      if (!rawValue) {
        return [];
      }

      const parsedValue = JSON.parse(rawValue);

      if (!Array.isArray(parsedValue)) {
        return [];
      }

      return parsedValue.filter(isTrip);
    } catch {
      return [];
    }
  };

  const writeStoredTrips = (nextTrips: Trip[]) => {
    if (!canUseStorage()) {
      return;
    }

    try {
      window.localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(nextTrips));
    } catch {
      // Ignore storage errors and keep the app usable.
    }
  };

  const upsertStoredTrip = (trip: Trip) => {
    const storedTrips = readStoredTrips();
    const existingIndex = storedTrips.findIndex((item) => item.uuid === trip.uuid);

    if (existingIndex === -1) {
      writeStoredTrips([trip, ...storedTrips]);
      return;
    }

    const nextTrips = [...storedTrips];
    nextTrips.splice(existingIndex, 1, trip);
    writeStoredTrips(nextTrips);
  };

  const removeStoredTrip = (tripId: string) => {
    writeStoredTrips(readStoredTrips().filter((trip) => trip.uuid !== tripId));
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

  const applyStoredTripsToList = (): TripListItem[] => {
    const storedTripItems = readStoredTrips().map(toTripListItem);
    trips.value = storedTripItems;

    return storedTripItems;
  };

  const applyStoredTripById = (tripId: string): Trip | null => {
    const storedTrip = readStoredTrips().find((trip) => trip.uuid === tripId) ?? null;
    currentTrip.value = storedTrip;

    if (storedTrip) {
      upsertTripInList(storedTrip);
    }

    return storedTrip;
  };

  const applyTripListFallbackById = (tripId: string): Trip | null => {
    const listItem = trips.value.find((trip) => trip.uuid === tripId) ?? null;

    if (!listItem) {
      return null;
    }

    const storedTrip = readStoredTrips().find((trip) => trip.uuid === tripId) ?? null;
    const fallbackTrip = createTripFromListItem(listItem, storedTrip);
    currentTrip.value = fallbackTrip;
    upsertStoredTrip(fallbackTrip);

    return fallbackTrip;
  };

  const fetchTrips = async (params?: { limit?: number; offset?: number }): Promise<TripListItem[]> => {
    isLoading.value = true;
    clearError();

    try {
      const response = await apiFetch<TripListResponse>('/trips/', {
        method: 'GET',
        query: params,
        timeout: TRIPS_REQUEST_TIMEOUT_MS,
      });

      const normalizedTrips = extractTripList(response);

      if (!normalizedTrips.length) {
        const storedTrips = applyStoredTripsToList();

        if (storedTrips.length) {
          return storedTrips;
        }
      }

      trips.value = normalizedTrips;
      return normalizedTrips;
    } catch (requestError) {
      const storedTrips = applyStoredTripsToList();

      if (storedTrips.length) {
        error.value = null;
        return storedTrips;
      }

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
        timeout: TRIPS_REQUEST_TIMEOUT_MS,
      });

      const normalizedTrip = extractTrip(response);

      if (!normalizedTrip) {
        const storedTrip = applyStoredTripById(tripId);

        if (storedTrip) {
          return storedTrip;
        }

        const tripListFallback = applyTripListFallbackById(tripId);

        if (tripListFallback) {
          return tripListFallback;
        }

        error.value = 'Детали поездки пока недоступны. Попробуйте открыть ее позже.';
        return null;
      }

      currentTrip.value = normalizedTrip;
      upsertTripInList(normalizedTrip);
      upsertStoredTrip(normalizedTrip);

      return normalizedTrip;
    } catch (requestError) {
      const storedTrip = applyStoredTripById(tripId);

      if (storedTrip) {
        error.value = null;
        return storedTrip;
      }

      const tripListFallback = applyTripListFallbackById(tripId);

      if (tripListFallback) {
        error.value = null;
        return tripListFallback;
      }

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
        error.value = 'Поездка создана, но ответ сервера пришел в неполном формате.';
        return null;
      }

      const nextTrip = normalizedTrip ?? createTripFromPayload(createdTrip.uuid, payload);
      currentTrip.value = nextTrip;
      upsertTripInList(nextTrip);
      upsertStoredTrip(nextTrip);

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
        error.value = 'Изменения сохранены, но обновленные данные поездки пока недоступны.';
        return null;
      }

      const nextTrip = normalizedTrip ?? fallbackTrip;

      if (!nextTrip) {
        return null;
      }

      currentTrip.value = nextTrip;
      upsertTripInList(nextTrip);
      upsertStoredTrip(nextTrip);

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
      removeStoredTrip(tripId);

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
        timeout: SHARE_REQUEST_TIMEOUT_MS,
      });

      const normalizedTrip = extractTrip(response as TripResponse);
      const shareResult = extractTripShareResult(response);

      if (normalizedTrip) {
        currentTrip.value = normalizedTrip;
        upsertTripInList(normalizedTrip);
        upsertStoredTrip(normalizedTrip);
      } else if (shareResult?.share_slug && currentTrip.value?.uuid === tripId) {
        currentTrip.value = {
          ...currentTrip.value,
          share_slug: shareResult.share_slug,
        };
        upsertStoredTrip(currentTrip.value);
      }

      if (!shareResult) {
        error.value = 'Ссылка для поездки создана, но ответ сервера пришел в неполном формате.';
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
