import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useApiClient } from '~/composables/useApiClient';
import type { GeoJsonLineString, RouteBuildResponse, RouteDay } from '~/types/route';
import { normalizeApiError } from '~/utils/apiError';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const decodePolyline = (encoded: string): [number, number][] | null => {
  if (!encoded.trim()) {
    return null;
  }

  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const coordinates: [number, number][] = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index <= encoded.length);

    const latitudeDelta = result & 1 ? ~(result >> 1) : result >> 1;
    latitude += latitudeDelta;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index <= encoded.length);

    const longitudeDelta = result & 1 ? ~(result >> 1) : result >> 1;
    longitude += longitudeDelta;

    coordinates.push([longitude / 1e5, latitude / 1e5]);
  }

  return coordinates.length >= 2 ? coordinates : null;
};

const normalizeCoordinates = (value: unknown): [number, number][] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const coordinates: [number, number][] = [];

  for (const item of value) {
    if (Array.isArray(item) && item.length >= 2 && isNumber(item[0]) && isNumber(item[1])) {
      coordinates.push([item[0], item[1]]);
      continue;
    }

    if (isRecord(item) && isNumber(item.lng) && isNumber(item.lat)) {
      coordinates.push([item.lng, item.lat]);
      continue;
    }

    return null;
  }

  return coordinates.length >= 2 ? coordinates : null;
};

const normalizeGeometry = (value: unknown): GeoJsonLineString | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    const decodedCoordinates = decodePolyline(value);

    return decodedCoordinates
      ? {
        type: 'LineString',
        coordinates: decodedCoordinates,
      }
      : null;
  }

  if (Array.isArray(value)) {
    const coordinates = normalizeCoordinates(value);

    return coordinates
      ? {
        type: 'LineString',
        coordinates,
      }
      : null;
  }

  if (!isRecord(value)) {
    return null;
  }

  if (value.type === 'LineString') {
    const coordinates = normalizeCoordinates(value.coordinates);

    return coordinates
      ? {
        type: 'LineString',
        coordinates,
      }
      : null;
  }

  if (value.type === 'Feature' && isRecord(value.geometry)) {
    return normalizeGeometry(value.geometry);
  }

  return normalizeGeometry(
    value.geometry
    ?? value.geojson
    ?? value.polyline
    ?? value.coordinates,
  );
};

const normalizeRouteDay = (value: unknown, fallbackDay: number): RouteDay | null => {
  if (!isRecord(value)) {
    return null;
  }

  const day = isNumber(value.day) ? value.day : fallbackDay;
  const geometry = normalizeGeometry(
    value.geometry
    ?? value.geojson
    ?? value.polyline
    ?? value.coordinates,
  );

  const normalizedDay: RouteDay = {
    day,
  };

  if (isNumber(value.distance_km)) {
    normalizedDay.distance_km = value.distance_km;
  }

  if (isNumber(value.duration_minutes)) {
    normalizedDay.duration_minutes = value.duration_minutes;
  }

  if (geometry) {
    normalizedDay.geometry = geometry;
  }

  return normalizedDay;
};

const extractDays = (value: unknown): RouteDay[] => {
  if (Array.isArray(value)) {
    return value
      .map((item, index) => normalizeRouteDay(item, index + 1))
      .filter((item): item is RouteDay => item !== null);
  }

  if (!isRecord(value)) {
    return [];
  }

  const candidates = [
    value.days,
    value.route_days,
    value.routes,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return extractDays(candidate);
    }
  }

  const singleDayCandidate = normalizeRouteDay(value, 1);

  if (singleDayCandidate && (singleDayCandidate.geometry || isNumber(value.distance_km) || isNumber(value.duration_minutes))) {
    return [singleDayCandidate];
  }

  return [];
};

const unwrapRoutePayload = (payload: unknown): unknown => {
  if (!isRecord(payload)) {
    return payload;
  }

  const nestedCandidates = [payload.route, payload.result, payload.data];

  for (const candidate of nestedCandidates) {
    if (candidate !== undefined && candidate !== null) {
      return unwrapRoutePayload(candidate);
    }
  }

  return payload;
};

const normalizeRouteResponse = (payload: unknown): RouteBuildResponse => {
  const rootPayload = unwrapRoutePayload(payload);
  const normalizedRoute: RouteBuildResponse = {};

  if (isRecord(payload) && typeof payload.trip_uuid === 'string') {
    normalizedRoute.trip_uuid = payload.trip_uuid;
  }

  if (isRecord(rootPayload) && typeof rootPayload.trip_uuid === 'string') {
    normalizedRoute.trip_uuid = rootPayload.trip_uuid;
  }

  const days = extractDays(rootPayload);

  if (days.length > 0) {
    normalizedRoute.days = days;
  }

  return normalizedRoute;
};

const getRouteErrorMessage = (error: unknown, fallback: string) => {
  const normalized = normalizeApiError(error, fallback);

  if (normalized.status === 401) {
    return 'Не авторизован. Войдите снова, чтобы построить маршрут.';
  }

  if (normalized.status === 403) {
    return 'Нет прав на редактирование этой поездки';
  }

  if (normalized.status === 404) {
    return 'Backend пока не отдает POST /trips/{trip_id}/route/build: сейчас этот endpoint отвечает 404.';
  }

  if (normalized.status === 422) {
    return normalized.message || 'Не удалось построить маршрут из-за данных';
  }

  return normalized.message || fallback;
};

export const useRouteStore = defineStore('route', () => {
  const { apiFetch } = useApiClient();

  const route = ref<RouteBuildResponse | null>(null);
  const isBuilding = ref(false);
  const error = ref<string | null>(null);

  const clearRoute = () => {
    route.value = null;
  };

  const clearError = () => {
    error.value = null;
  };

  const buildRoute = async (tripId: string): Promise<RouteBuildResponse | null> => {
    isBuilding.value = true;
    clearError();

    try {
      const response = await apiFetch<unknown>(`/trips/${encodeURIComponent(tripId)}/route/build`, {
        method: 'POST',
      });

      const normalizedRoute = normalizeRouteResponse(response);
      route.value = normalizedRoute;

      return normalizedRoute;
    } catch (requestError) {
      route.value = null;
      error.value = getRouteErrorMessage(requestError, 'Не удалось построить маршрут. Попробуйте позже.');

      return null;
    } finally {
      isBuilding.value = false;
    }
  };

  return {
    route,
    isBuilding,
    error,
    buildRoute,
    clearRoute,
    clearError,
  };
});
