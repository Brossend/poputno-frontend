import type { Place, PlaceCategory } from '~/types/place';
import type { GeoJsonLineString, RouteBuildResponse, RouteDay } from '~/types/route';
import type { Trip, TripPace } from '~/types/trip';

const FALLBACK_SHARE_VERSION = 1;
const HASH_KEY_PARAM = 'key';
const HASH_IV_PARAM = 'iv';
const HASH_DATA_PARAM = 'data';
const HASH_VERSION_PARAM = 'v';
const HASH_COMPRESSED_PARAM = 'zip';
const AES_GCM_IV_LENGTH = 12;
const AES_GCM_KEY_LENGTH = 32;
const DEFAULT_SHARED_TRIP_ID = 'shared-trip';
const EARTH_RADIUS_KM = 6371;
const WALKING_SPEED_KMH = 5;
const DRIVING_SPEED_KMH = 35;

interface SharedTripCore {
  title: string;
  city: string;
  city_lat?: number;
  city_lng?: number;
  date_from: string;
  date_to: string;
  pace: TripPace;
  days_count?: number;
  places_count?: number;
}

interface SharedTripPlace {
  name: string;
  lat: number;
  lng: number;
  category: PlaceCategory;
  day: number;
  order: number;
  duration_minutes: number;
  visited: boolean;
  address?: string | null;
  osm_id?: number | null;
}

interface SharedTripRouteDay {
  day: number;
  distance_km?: number;
  duration_minutes?: number;
  geometry?: GeoJsonLineString | null;
}

interface SharedTripRoute {
  mode?: 'driving' | 'walking';
  source?: string;
  days: SharedTripRouteDay[];
}

export interface SharedTripSnapshot {
  version: 1;
  exported_at: string;
  trip: SharedTripCore;
  places: SharedTripPlace[];
  route: SharedTripRoute | null;
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

const TRIP_PACES: TripPace[] = ['relaxed', 'moderate', 'intensive'];

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isOptionalNumber = (value: unknown): value is number | undefined => (
  value === undefined || (typeof value === 'number' && Number.isFinite(value))
);

const isOptionalNullableNumber = (value: unknown): value is number | null | undefined => (
  value === undefined || value === null || (typeof value === 'number' && Number.isFinite(value))
);

const isOptionalNullableString = (value: unknown): value is string | null | undefined => (
  value === undefined || value === null || typeof value === 'string'
);

const isTripPace = (value: unknown): value is TripPace => (
  typeof value === 'string' && TRIP_PACES.includes(value as TripPace)
);

const isPlaceCategory = (value: unknown): value is PlaceCategory => (
  typeof value === 'string' && PLACE_CATEGORIES.includes(value as PlaceCategory)
);

const isGeoJsonLineString = (value: unknown): value is GeoJsonLineString => {
  if (!isRecord(value) || value.type !== 'LineString' || !Array.isArray(value.coordinates)) {
    return false;
  }

  return value.coordinates.every((coordinate) => (
    Array.isArray(coordinate)
    && coordinate.length >= 2
    && typeof coordinate[0] === 'number'
    && typeof coordinate[1] === 'number'
  ));
};

const isSharedTripCore = (value: unknown): value is SharedTripCore => (
  isRecord(value)
  && typeof value.title === 'string'
  && typeof value.city === 'string'
  && typeof value.date_from === 'string'
  && typeof value.date_to === 'string'
  && isTripPace(value.pace)
  && isOptionalNumber(value.city_lat)
  && isOptionalNumber(value.city_lng)
  && isOptionalNumber(value.days_count)
  && isOptionalNumber(value.places_count)
);

const isSharedTripPlace = (value: unknown): value is SharedTripPlace => (
  isRecord(value)
  && typeof value.name === 'string'
  && typeof value.lat === 'number'
  && typeof value.lng === 'number'
  && isPlaceCategory(value.category)
  && typeof value.day === 'number'
  && typeof value.order === 'number'
  && typeof value.duration_minutes === 'number'
  && typeof value.visited === 'boolean'
  && isOptionalNullableString(value.address)
  && isOptionalNullableNumber(value.osm_id)
);

const isSharedTripRouteDay = (value: unknown): value is SharedTripRouteDay => (
  isRecord(value)
  && typeof value.day === 'number'
  && isOptionalNumber(value.distance_km)
  && isOptionalNumber(value.duration_minutes)
  && (value.geometry === undefined || value.geometry === null || isGeoJsonLineString(value.geometry))
);

const isSharedTripRoute = (value: unknown): value is SharedTripRoute => (
  isRecord(value)
  && (value.mode === undefined || value.mode === 'driving' || value.mode === 'walking')
  && (value.source === undefined || typeof value.source === 'string')
  && Array.isArray(value.days)
  && value.days.every(isSharedTripRouteDay)
);

const uint8ArrayToBase64Url = (bytes: Uint8Array) => {
  let binary = '';
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const base64UrlToUint8Array = (value: string) => {
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const toArrayBuffer = (bytes: Uint8Array) => {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);

  return buffer;
};

const streamToBytes = async (stream: ReadableStream<Uint8Array>) => {
  const response = new Response(stream);

  return new Uint8Array(await response.arrayBuffer());
};

const maybeCompressBytes = async (bytes: Uint8Array) => {
  if (typeof CompressionStream === 'undefined') {
    return {
      bytes,
      compressed: false,
    };
  }

  const compressionStream = new CompressionStream('gzip');
  const writer = compressionStream.writable.getWriter();
  await writer.write(toArrayBuffer(bytes));
  await writer.close();

  return {
    bytes: await streamToBytes(compressionStream.readable),
    compressed: true,
  };
};

const maybeDecompressBytes = async (bytes: Uint8Array, compressed: boolean) => {
  if (!compressed) {
    return bytes;
  }

  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream is not supported in this browser.');
  }

  const decompressionStream = new DecompressionStream('gzip');
  const writer = decompressionStream.writable.getWriter();
  await writer.write(toArrayBuffer(bytes));
  await writer.close();

  return streamToBytes(decompressionStream.readable);
};

const importAesKey = (rawKey: Uint8Array, usage: KeyUsage) => crypto.subtle.importKey(
  'raw',
  toArrayBuffer(rawKey),
  { name: 'AES-GCM' },
  false,
  [usage],
);

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
    const dayPlaces = groups.get(place.day) ?? [];
    dayPlaces.push(place);
    groups.set(place.day, dayPlaces);
  }

  return Array.from(groups.entries())
    .sort(([leftDay], [rightDay]) => leftDay - rightDay)
    .map(([day, dayPlaces]) => ({ day, places: dayPlaces }));
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

const estimateTravelDurationMinutes = (
  distanceKm: number | undefined,
  mode: 'driving' | 'walking',
) => {
  if (typeof distanceKm !== 'number' || distanceKm <= 0) {
    return undefined;
  }

  const speedKmh = mode === 'walking' ? WALKING_SPEED_KMH : DRIVING_SPEED_KMH;

  return Math.max(1, Math.round((distanceKm / speedKmh) * 60));
};

const normalizeSharedRouteDay = (routeDay: RouteDay): SharedTripRouteDay => ({
  day: routeDay.day,
  distance_km: routeDay.distance_km,
  duration_minutes: routeDay.duration_minutes,
  geometry: routeDay.geometry ?? null,
});

export const buildLocalSharedRoute = (
  tripId: string,
  places: Place[],
  mode: 'driving' | 'walking' = 'driving',
): RouteBuildResponse | null => {
  const days = groupPlacesByDay(places)
    .map(({ day, places: dayPlaces }) => {
      const coordinates = dayPlaces.map((place) => [place.lng, place.lat] as [number, number]);
      const distanceKm = calculatePolylineDistanceKm(coordinates);
      const routeDay: RouteDay = {
        day,
        distance_km: distanceKm,
        duration_minutes: estimateTravelDurationMinutes(distanceKm, mode),
      };

      if (coordinates.length >= 2) {
        routeDay.geometry = {
          type: 'LineString',
          coordinates,
        };
      }

      return routeDay;
    })
    .filter((routeDay) => routeDay.geometry || typeof routeDay.duration_minutes === 'number');

  if (!days.length) {
    return null;
  }

  return {
    trip_uuid: tripId,
    mode,
    source: 'local-straight',
    days,
  };
};

export const buildSharedTripSnapshot = (
  trip: Trip,
  places: Place[],
  route: RouteBuildResponse | null,
): SharedTripSnapshot => ({
  version: FALLBACK_SHARE_VERSION,
  exported_at: new Date().toISOString(),
  trip: {
    title: trip.title,
    city: trip.city,
    city_lat: trip.city_lat,
    city_lng: trip.city_lng,
    date_from: trip.date_from,
    date_to: trip.date_to,
    pace: trip.pace,
    days_count: trip.days_count,
    places_count: places.length || trip.places_count,
  },
  places: places.map((place) => ({
    name: place.name,
    lat: place.lat,
    lng: place.lng,
    category: place.category,
    day: place.day,
    order: place.order,
    duration_minutes: place.duration_minutes,
    visited: place.visited,
    address: place.address ?? null,
    osm_id: place.osm_id ?? null,
  })),
  route: route
    ? {
      mode: route.mode,
      source: route.source,
      days: (route.days ?? []).map(normalizeSharedRouteDay),
    }
    : null,
});

export const createEncryptedFallbackShareUrl = async (
  snapshot: SharedTripSnapshot,
  origin: string,
) => {
  const textEncoder = new TextEncoder();
  const payloadBytes = textEncoder.encode(JSON.stringify(snapshot));
  let preparedBytes = payloadBytes;
  let compressed = false;

  try {
    const compressedPayload = await maybeCompressBytes(payloadBytes);
    preparedBytes = new Uint8Array(compressedPayload.bytes);
    compressed = compressedPayload.compressed;
  } catch {
    preparedBytes = payloadBytes;
    compressed = false;
  }

  const rawKey = crypto.getRandomValues(new Uint8Array(AES_GCM_KEY_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LENGTH));
  const cryptoKey = await importAesKey(rawKey, 'encrypt');
  const encryptedBytes = new Uint8Array(await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    cryptoKey,
    toArrayBuffer(preparedBytes),
  ));

  const hashParams = new URLSearchParams({
    [HASH_VERSION_PARAM]: String(FALLBACK_SHARE_VERSION),
    [HASH_KEY_PARAM]: uint8ArrayToBase64Url(rawKey),
    [HASH_IV_PARAM]: uint8ArrayToBase64Url(iv),
    [HASH_DATA_PARAM]: uint8ArrayToBase64Url(encryptedBytes),
  });

  if (compressed) {
    hashParams.set(HASH_COMPRESSED_PARAM, '1');
  }

  const url = new URL('/share/fallback', origin);
  url.hash = hashParams.toString();

  return url.toString();
};

export const hasEncryptedFallbackShareHash = (hash: string) => {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);

  return Boolean(
    params.get(HASH_KEY_PARAM)
    && params.get(HASH_IV_PARAM)
    && params.get(HASH_DATA_PARAM),
  );
};

export const decryptFallbackShareSnapshot = async (hash: string): Promise<SharedTripSnapshot | null> => {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const version = Number(params.get(HASH_VERSION_PARAM));
  const rawKey = params.get(HASH_KEY_PARAM);
  const rawIv = params.get(HASH_IV_PARAM);
  const rawData = params.get(HASH_DATA_PARAM);
  const compressed = params.get(HASH_COMPRESSED_PARAM) === '1';

  if (
    version !== FALLBACK_SHARE_VERSION
    || !rawKey
    || !rawIv
    || !rawData
  ) {
    return null;
  }

  const keyBytes = base64UrlToUint8Array(rawKey);
  const ivBytes = base64UrlToUint8Array(rawIv);
  const encryptedBytes = base64UrlToUint8Array(rawData);
  const cryptoKey = await importAesKey(keyBytes, 'decrypt');
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
    },
    cryptoKey,
    encryptedBytes,
  );

  const preparedBytes = await maybeDecompressBytes(new Uint8Array(decryptedBuffer), compressed);
  const parsed = JSON.parse(new TextDecoder().decode(preparedBytes)) as unknown;

  if (!isRecord(parsed)) {
    return null;
  }

  if (
    parsed.version !== FALLBACK_SHARE_VERSION
    || typeof parsed.exported_at !== 'string'
    || !isSharedTripCore(parsed.trip)
    || !Array.isArray(parsed.places)
    || !parsed.places.every(isSharedTripPlace)
    || !(parsed.route === null || isSharedTripRoute(parsed.route))
  ) {
    return null;
  }

  return parsed as unknown as SharedTripSnapshot;
};

export const materializeFallbackShareSnapshot = (snapshot: SharedTripSnapshot) => {
  const tripId = `${DEFAULT_SHARED_TRIP_ID}-${snapshot.exported_at}`;
  const createdAt = snapshot.exported_at;
  const maxDay = snapshot.places.reduce((result, place) => Math.max(result, place.day), 1);

  const trip: Trip = {
    uuid: tripId,
    title: snapshot.trip.title,
    city: snapshot.trip.city,
    city_lat: snapshot.trip.city_lat,
    city_lng: snapshot.trip.city_lng,
    date_from: snapshot.trip.date_from,
    date_to: snapshot.trip.date_to,
    pace: snapshot.trip.pace,
    share_slug: null,
    created_at: createdAt,
    updated_at: createdAt,
    days_count: snapshot.trip.days_count ?? maxDay,
    places_count: snapshot.trip.places_count ?? snapshot.places.length,
  };

  const places: Place[] = snapshot.places.map((place, index) => ({
    uuid: `${tripId}-place-${index + 1}`,
    trip_uuid: tripId,
    name: place.name,
    lat: place.lat,
    lng: place.lng,
    category: place.category,
    day: place.day,
    order: place.order,
    duration_minutes: place.duration_minutes,
    visited: place.visited,
    address: place.address ?? null,
    osm_id: place.osm_id ?? null,
    created_at: createdAt,
  }));

  const route: RouteBuildResponse | null = snapshot.route
    ? {
      trip_uuid: tripId,
      mode: snapshot.route.mode,
      source: snapshot.route.source,
      days: snapshot.route.days.map((routeDay) => ({
        day: routeDay.day,
        distance_km: routeDay.distance_km,
        duration_minutes: routeDay.duration_minutes,
        geometry: routeDay.geometry ?? null,
      })),
    }
    : null;

  return {
    trip,
    places,
    route,
  };
};
