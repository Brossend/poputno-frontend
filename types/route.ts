import type { Place } from '~/types/place';

export interface GeoJsonLineString {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface RouteDay {
  day: number;
  distance_km?: number;
  duration_minutes?: number;
  geometry?: GeoJsonLineString | null;
  places?: Place[];
}

export interface RouteBuildResponse {
  trip_uuid?: string;
  days?: RouteDay[];
  [key: string]: unknown;
}

export interface RouteMapSegment {
  day: number;
  latLngs: [number, number][];
  distance_km?: number;
  duration_minutes?: number;
  isFallback?: boolean;
}
