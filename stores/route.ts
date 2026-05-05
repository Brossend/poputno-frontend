import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useApiClient } from '~/composables/useApiClient';
import { usePlacesStore } from '~/stores/places';
import type { Place } from '~/types/place';
import type { GeoJsonLineString, RouteBuildResponse, RouteDay } from '~/types/route';
import { normalizeApiError } from '~/utils/apiError';

const OSRM_ROUTE_BASE_URL = 'https://router.project-osrm.org/route/v1';
type LocalRouteMode = 'driving' | 'walking';
const ROUTE_REQUEST_TIMEOUT_MS = 3000;
const WALKING_SPEED_KMH = 5;
const WALKING_TO_DRIVING_DURATION_FACTOR = 3.5;
const EARTH_RADIUS_KM = 6371;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const createTimeoutSignal = () => (
  typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(ROUTE_REQUEST_TIMEOUT_MS)
    : undefined
);

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

  for (const candidate of [value.days, value.route_days, value.routes]) {
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

  for (const candidate of [payload.route, payload.result, payload.data]) {
    if (candidate !== undefined && candidate !== null) {
      return unwrapRoutePayload(candidate);
    }
  }

  return payload;
};

const normalizeRouteMode = (value: unknown): LocalRouteMode | undefined => {
  if (value === 'driving' || value === 'walking') {
    return value;
  }

  return undefined;
};

const estimateWalkingDurationMinutes = (distanceKm?: number, drivingDurationMinutes?: number) => {
  if (typeof distanceKm === 'number' && distanceKm > 0) {
    return Math.max(1, Math.round((distanceKm / WALKING_SPEED_KMH) * 60));
  }

  if (typeof drivingDurationMinutes === 'number' && drivingDurationMinutes > 0) {
    return Math.max(1, Math.round(drivingDurationMinutes * WALKING_TO_DRIVING_DURATION_FACTOR));
  }

  return undefined;
};

const toRadians = (degrees: number) => degrees * (Math.PI / 180);

const calculateDistanceBetweenPointsKm = (
  [fromLng, fromLat]: [number, number],
  [toLng, toLat]: [number, number],
) => {
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const fromLatRadians = toRadians(fromLat);
  const toLatRadians = toRadians(toLat);

  const haversine = (
    Math.sin(deltaLat / 2) ** 2
    + Math.cos(fromLatRadians) * Math.cos(toLatRadians) * Math.sin(deltaLng / 2) ** 2
  );

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const calculatePolylineDistanceKm = (coordinates: [number, number][]) => {
  if (coordinates.length < 2) {
    return undefined;
  }

  let totalDistanceKm = 0;

  for (let index = 1; index < coordinates.length; index += 1) {
    totalDistanceKm += calculateDistanceBetweenPointsKm(coordinates[index - 1]!, coordinates[index]!);
  }

  return totalDistanceKm > 0 ? totalDistanceKm : undefined;
};

const normalizeRouteDayDurationForMode = (routeDay: RouteDay, mode: LocalRouteMode): RouteDay => {
  if (mode !== 'walking') {
    return routeDay;
  }

  const walkingDuration = estimateWalkingDurationMinutes(
    routeDay.distance_km,
    routeDay.duration_minutes,
  );

  return walkingDuration
    ? {
      ...routeDay,
      duration_minutes: walkingDuration,
    }
    : routeDay;
};

const normalizeRouteResponse = (
  payload: unknown,
  requestedMode: LocalRouteMode = 'driving',
): RouteBuildResponse => {
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
    normalizedRoute.days = days.map((routeDay) => normalizeRouteDayDurationForMode(routeDay, requestedMode));
  }

  const payloadMode = isRecord(payload)
    ? normalizeRouteMode(payload.mode)
    : (
      isRecord(rootPayload)
        ? normalizeRouteMode(rootPayload.mode)
        : undefined
    );

  normalizedRoute.mode = payloadMode ?? requestedMode;

  return normalizedRoute;
};

const sortPlaces = (places: Place[]) => [...places].sort((left, right) => {
  if (left.day !== right.day) {
    return left.day - right.day;
  }

  if (left.order !== right.order) {
    return left.order - right.order;
  }

  return left.name.localeCompare(right.name, 'ru');
});

const groupPlacesByDay = (places: Place[]) => {
  const groups = new Map<number, Place[]>();

  for (const place of sortPlaces(places)) {
    const items = groups.get(place.day) ?? [];
    items.push(place);
    groups.set(place.day, items);
  }

  return Array.from(groups.entries())
    .sort(([leftDay], [rightDay]) => leftDay - rightDay)
    .map(([day, dayPlaces]) => ({ day, places: dayPlaces }));
};

const buildStraightLineRouteFromPlaces = (
  tripId: string,
  places: Place[],
  mode: LocalRouteMode,
): RouteBuildResponse | null => {
  const days = groupPlacesByDay(places)
    .map(({ day, places: dayPlaces }) => {
      const coordinates = dayPlaces.map((place) => [place.lng, place.lat] as [number, number]);
      const distanceKm = calculatePolylineDistanceKm(coordinates);
      const fallbackPlaceDuration = dayPlaces.reduce((total, place) => total + place.duration_minutes, 0) || undefined;
      const routeDay: RouteDay = {
        day,
        distance_km: distanceKm,
        duration_minutes: mode === 'walking'
          ? estimateWalkingDurationMinutes(distanceKm, fallbackPlaceDuration)
          : fallbackPlaceDuration,
        places: dayPlaces,
      };

      if (dayPlaces.length >= 2) {
        routeDay.geometry = {
          type: 'LineString',
          coordinates,
        };
      }

      return routeDay;
    })
    .filter((routeDay) => (routeDay.places?.length ?? 0) > 0);

  if (!days.length) {
    return null;
  }

  return {
    trip_uuid: tripId,
    days,
    source: 'local-straight',
  };
};

const fetchOsrmRouteForDay = async (dayPlaces: Place[], mode: LocalRouteMode): Promise<RouteDay | null> => {
  if (dayPlaces.length < 2) {
    return {
      day: dayPlaces[0]?.day ?? 1,
      duration_minutes: dayPlaces.reduce((total, place) => total + place.duration_minutes, 0) || undefined,
      places: dayPlaces,
    };
  }

  const coordinates = dayPlaces
    .map((place) => `${place.lng},${place.lat}`)
    .join(';');

  const profile = mode === 'walking' ? 'foot' : 'driving';
  const url = `${OSRM_ROUTE_BASE_URL}/${profile}/${coordinates}?overview=full&geometries=geojson&steps=false`;
  const response = await fetch(url, {
    method: 'GET',
    signal: createTimeoutSignal(),
  });

  if (!response.ok) {
    throw new Error(`OSRM request failed with status ${response.status}`);
  }

  const payload = await response.json() as {
    routes?: Array<{
      geometry?: unknown;
      distance?: unknown;
      duration?: unknown;
    }>;
  };

  const routeCandidate = Array.isArray(payload.routes) ? payload.routes[0] : null;
  const geometry = normalizeGeometry(routeCandidate?.geometry);
  const distanceKm = typeof routeCandidate?.distance === 'number' ? routeCandidate.distance / 1000 : undefined;
  const responseDurationMinutes = typeof routeCandidate?.duration === 'number'
    ? Math.round(routeCandidate.duration / 60)
    : undefined;
  const fallbackPlaceDuration = dayPlaces.reduce((total, place) => total + place.duration_minutes, 0) || undefined;

  return {
    day: dayPlaces[0]?.day ?? 1,
    distance_km: distanceKm,
    duration_minutes: mode === 'walking'
      ? estimateWalkingDurationMinutes(distanceKm, responseDurationMinutes ?? fallbackPlaceDuration)
      : responseDurationMinutes ?? fallbackPlaceDuration,
    geometry,
    places: dayPlaces,
  };
};

const buildRoadRouteFromPlaces = async (
  tripId: string,
  places: Place[],
  mode: LocalRouteMode,
): Promise<RouteBuildResponse | null> => {
  const dayGroups = groupPlacesByDay(places);

  if (!dayGroups.length) {
    return null;
  }

  const days = await Promise.all(dayGroups.map(({ places: dayPlaces }) => fetchOsrmRouteForDay(dayPlaces, mode)));
  const normalizedDays = days.filter((routeDay): routeDay is RouteDay => routeDay !== null);

  if (!normalizedDays.length) {
    return null;
  }

  return {
    trip_uuid: tripId,
    days: normalizedDays,
    source: 'osrm',
    mode,
  };
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

  if (normalized.status === 500) {
    return 'Backend вернул 500 при построении маршрута.';
  }

  return normalized.message || fallback;
};

export const useRouteStore = defineStore('route', () => {
  const { apiFetch } = useApiClient();
  const placesStore = usePlacesStore();

  const route = ref<RouteBuildResponse | null>(null);
  const isBuilding = ref(false);
  const error = ref<string | null>(null);

  const clearRoute = () => {
    route.value = null;
  };

  const clearError = () => {
    error.value = null;
  };

  const buildRoute = async (
    tripId: string,
    mode: LocalRouteMode = 'driving',
  ): Promise<RouteBuildResponse | null> => {
    isBuilding.value = true;
    clearError();

    try {
      const response = await apiFetch<unknown>(`/trips/${encodeURIComponent(tripId)}/route/build`, {
        method: 'POST',
        timeout: ROUTE_REQUEST_TIMEOUT_MS,
      });

      const normalizedRoute = normalizeRouteResponse(response, mode);

      if (!normalizedRoute.days?.length) {
        throw new Error('Route response has no days.');
      }

      route.value = normalizedRoute;
      return normalizedRoute;
    } catch (requestError) {
      try {
        const osrmRoute = await buildRoadRouteFromPlaces(tripId, placesStore.places, mode);

        if (osrmRoute) {
          route.value = osrmRoute;
          error.value = null;
          return osrmRoute;
        }
      } catch {
        // If public road routing also fails, fall back to direct segments below.
      }

      const localRoute = buildStraightLineRouteFromPlaces(tripId, placesStore.places, mode);

      if (localRoute) {
        localRoute.mode = mode;
        route.value = localRoute;
        error.value = null;
        return localRoute;
      }

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
