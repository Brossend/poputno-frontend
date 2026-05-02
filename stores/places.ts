import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useApiClient } from '~/composables/useApiClient';
import type { CreatePlacePayload, Place, PlaceCategory, UpdatePlacePayload } from '~/types/place';
import { normalizeApiError } from '~/utils/apiError';

type PlaceListResponse =
  | Place[]
  | {
    items?: unknown;
    results?: unknown;
    data?: unknown;
  };

type PlaceResponse =
  | Place
  | null
  | {
    place?: unknown;
    result?: unknown;
    data?: unknown;
  };

export interface PlaceDayGroup {
  day: number;
  places: Place[];
}

interface PlacesErrorOptions {
  notFoundMessage?: string;
}

const PLACE_CATEGORIES: PlaceCategory[] = [
  'attraction',
  'museum',
  'cafe',
  'restaurant',
  'park',
  'viewpoint',
  'shopping',
  'other',
];

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isPlaceCategory = (value: unknown): value is PlaceCategory => (
  typeof value === 'string' && PLACE_CATEGORIES.includes(value as PlaceCategory)
);

const isOptionalNullableString = (value: unknown): value is string | null | undefined => (
  value === undefined || value === null || typeof value === 'string'
);

const isOptionalNullableNumber = (value: unknown): value is number | null | undefined => (
  value === undefined || value === null || typeof value === 'number'
);

const normalizePlace = (value: unknown): Place | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.uuid !== 'string'
    || typeof value.trip_uuid !== 'string'
    || typeof value.name !== 'string'
    || typeof value.lat !== 'number'
    || typeof value.lng !== 'number'
    || !isPlaceCategory(value.category)
    || typeof value.day !== 'number'
    || typeof value.order !== 'number'
    || typeof value.duration_minutes !== 'number'
    || typeof value.visited !== 'boolean'
    || typeof value.created_at !== 'string'
    || !isOptionalNullableString(value.address)
    || !isOptionalNullableNumber(value.osm_id)
  ) {
    return null;
  }

  return {
    uuid: value.uuid,
    trip_uuid: value.trip_uuid,
    name: value.name,
    lat: value.lat,
    lng: value.lng,
    category: value.category,
    day: value.day,
    order: value.order,
    duration_minutes: value.duration_minutes,
    visited: value.visited,
    address: value.address,
    osm_id: value.osm_id,
    created_at: value.created_at,
  };
};

const sortPlaces = (items: Place[]) => [...items].sort((left, right) => {
  if (left.day !== right.day) {
    return left.day - right.day;
  }

  if (left.order !== right.order) {
    return left.order - right.order;
  }

  return left.name.localeCompare(right.name, 'ru');
});

const extractPlaceList = (payload: PlaceListResponse): Place[] => {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.results)
        ? payload.results
        : Array.isArray(payload.data)
          ? payload.data
          : [];

  return sortPlaces(
    source
      .map(normalizePlace)
      .filter((item): item is Place => item !== null),
  );
};

const extractPlace = (payload: PlaceResponse): Place | null => {
  if (payload === null) {
    return null;
  }

  const normalizedPayload = normalizePlace(payload);

  if (normalizedPayload) {
    return normalizedPayload;
  }

  if (isRecord(payload)) {
    const candidates = [payload.place, payload.result, payload.data];

    for (const candidate of candidates) {
      const normalizedCandidate = normalizePlace(candidate);

      if (normalizedCandidate) {
        return normalizedCandidate;
      }
    }
  }

  return null;
};

const getPlacesErrorMessage = (error: unknown, fallback: string, options: PlacesErrorOptions = {}) => {
  const normalized = normalizeApiError(error, fallback);

  if (normalized.status === 401) {
    return 'Не авторизован. Войдите снова, чтобы продолжить работу в Попутно.';
  }

  if (normalized.status === 403) {
    return 'Нет прав на редактирование этой поездки';
  }

  if (normalized.status === 404) {
    return options.notFoundMessage ?? 'Поездка не найдена';
  }

  if (normalized.status === 422) {
    return normalized.message || 'Проверьте данные места и попробуйте снова.';
  }

  return normalized.message || fallback;
};

export const usePlacesStore = defineStore('places', () => {
  const { apiFetch } = useApiClient();

  const places = ref<Place[]>([]);
  const selectedPlaceId = ref<string | null>(null);
  const isLoading = ref(false);
  const isAdding = ref(false);
  const isUpdating = ref(false);
  const isDeleting = ref(false);
  const error = ref<string | null>(null);

  const placesByDay = computed<PlaceDayGroup[]>(() => {
    const groupedPlaces = new Map<number, Place[]>();

    for (const place of sortPlaces(places.value)) {
      const currentPlaces = groupedPlaces.get(place.day) ?? [];
      currentPlaces.push(place);
      groupedPlaces.set(place.day, currentPlaces);
    }

    return Array.from(groupedPlaces.entries())
      .sort(([leftDay], [rightDay]) => leftDay - rightDay)
      .map(([day, dayPlaces]) => ({
        day,
        places: dayPlaces,
      }));
  });

  const selectedPlace = computed(() => (
    places.value.find((place) => place.uuid === selectedPlaceId.value) ?? null
  ));

  const clearError = () => {
    error.value = null;
  };

  const selectPlace = (placeId: string | null) => {
    selectedPlaceId.value = placeId;
  };

  const applyPlaces = (nextPlaces: Place[]) => {
    places.value = nextPlaces;

    if (selectedPlaceId.value && !nextPlaces.some((place) => place.uuid === selectedPlaceId.value)) {
      selectedPlaceId.value = null;
    }
  };

  const requestPlaces = async (tripId: string, day?: number): Promise<Place[]> => {
    const response = await apiFetch<PlaceListResponse>(`/trips/${encodeURIComponent(tripId)}/places`, {
      method: 'GET',
      query: day ? { day } : undefined,
    });

    const normalizedPlaces = extractPlaceList(response);
    applyPlaces(normalizedPlaces);

    return normalizedPlaces;
  };

  const fetchPlaces = async (tripId: string, day?: number): Promise<Place[]> => {
    isLoading.value = true;
    clearError();

    try {
      return await requestPlaces(tripId, day);
    } catch (requestError) {
      places.value = [];
      selectedPlaceId.value = null;
      error.value = getPlacesErrorMessage(requestError, 'Не удалось загрузить места поездки.');

      return [];
    } finally {
      isLoading.value = false;
    }
  };

  const addPlace = async (tripId: string, payload: CreatePlacePayload): Promise<Place | null> => {
    isAdding.value = true;
    clearError();

    try {
      const response = await apiFetch<PlaceResponse>(`/trips/${encodeURIComponent(tripId)}/places`, {
        method: 'POST',
        body: payload,
      });

      const normalizedPlace = extractPlace(response);

      if (!normalizedPlace) {
        error.value = 'Место добавлено, но ответ сервера пришёл в неполном формате.';
        return null;
      }

      places.value = sortPlaces([...places.value, normalizedPlace]);
      selectedPlaceId.value = normalizedPlace.uuid;

      return normalizedPlace;
    } catch (requestError) {
      error.value = getPlacesErrorMessage(requestError, 'Не удалось добавить место в поездку.');

      return null;
    } finally {
      isAdding.value = false;
    }
  };

  const updatePlace = async (tripId: string, placeId: string, payload: UpdatePlacePayload): Promise<Place | null> => {
    isUpdating.value = true;
    clearError();

    try {
      const response = await apiFetch<PlaceResponse>(`/trips/${encodeURIComponent(tripId)}/places/${encodeURIComponent(placeId)}`, {
        method: 'PATCH',
        body: payload,
      });

      const normalizedPlace = extractPlace(response);

      if (normalizedPlace) {
        places.value = sortPlaces([
          ...places.value.filter((place) => place.uuid !== placeId),
          normalizedPlace,
        ]);
      }

      try {
        const refreshedPlaces = await requestPlaces(tripId);
        const refreshedPlace = refreshedPlaces.find((place) => place.uuid === placeId) ?? normalizedPlace;

        if (refreshedPlace) {
          selectedPlaceId.value = refreshedPlace.uuid;
          return refreshedPlace;
        }
      } catch {
        if (normalizedPlace) {
          selectedPlaceId.value = normalizedPlace.uuid;
          return normalizedPlace;
        }
      }

      error.value = 'Место обновлено, но не удалось синхронизировать свежий список.';
      return null;
    } catch (requestError) {
      error.value = getPlacesErrorMessage(
        requestError,
        'Не удалось обновить место в поездке.',
        { notFoundMessage: 'Место не найдено' },
      );

      return null;
    } finally {
      isUpdating.value = false;
    }
  };

  const deletePlace = async (tripId: string, placeId: string): Promise<boolean> => {
    isDeleting.value = true;
    clearError();

    const placeToDelete = places.value.find((place) => place.uuid === placeId) ?? null;

    try {
      await apiFetch<void>(`/trips/${encodeURIComponent(tripId)}/places/${encodeURIComponent(placeId)}`, {
        method: 'DELETE',
      });

      if (placeToDelete) {
        places.value = sortPlaces(
          places.value
            .filter((place) => place.uuid !== placeId)
            .map((place) => {
              if (place.day !== placeToDelete.day || place.order <= placeToDelete.order) {
                return place;
              }

              return {
                ...place,
                order: place.order - 1,
              };
            }),
        );
      } else {
        places.value = places.value.filter((place) => place.uuid !== placeId);
      }

      if (selectedPlaceId.value === placeId) {
        selectedPlaceId.value = null;
      }

      try {
        await requestPlaces(tripId);
      } catch {
        // Keep the local fallback ordering if the refresh request fails.
      }

      return true;
    } catch (requestError) {
      error.value = getPlacesErrorMessage(
        requestError,
        'Не удалось удалить место из поездки.',
        { notFoundMessage: 'Место не найдено' },
      );

      return false;
    } finally {
      isDeleting.value = false;
    }
  };

  return {
    places,
    selectedPlaceId,
    isLoading,
    isAdding,
    isUpdating,
    isDeleting,
    error,
    placesByDay,
    selectedPlace,
    fetchPlaces,
    addPlace,
    updatePlace,
    deletePlace,
    selectPlace,
    clearError,
  };
});
