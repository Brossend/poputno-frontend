export type PlaceCategory =
  | 'attraction'
  | 'museum'
  | 'cafe'
  | 'restaurant'
  | 'park'
  | 'viewpoint'
  | 'shopping'
  | 'other';

export interface Place {
  uuid: string;
  trip_uuid: string;
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
  created_at: string;
}

export interface CreatePlacePayload {
  name: string;
  lat: number;
  lng: number;
  category?: PlaceCategory;
  day?: number | null;
  order?: number | null;
  duration_minutes?: number;
  osm_id?: number | null;
  address?: string | null;
}

export interface UpdatePlacePayload {
  day?: number | null;
  order?: number | null;
  duration_minutes?: number | null;
  visited?: boolean | null;
}

export interface OsmSearchResult {
  osm_id: number;
  display_name: string;
  name: string;
  lat: number;
  lng: number;
  category: PlaceCategory;
  address: string | null;
}
