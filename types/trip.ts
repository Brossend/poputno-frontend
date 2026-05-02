export type TripPace = 'relaxed' | 'moderate' | 'intensive';

export interface Trip {
  uuid: string;
  title: string;
  city: string;
  city_lat?: number;
  city_lng?: number;
  date_from: string;
  date_to: string;
  pace: TripPace;
  share_slug?: string | null;
  created_at: string;
  updated_at?: string;
  days_count?: number;
  places_count?: number;
}

export interface TripListItem {
  uuid: string;
  title: string;
  city: string;
  date_from: string;
  date_to: string;
  places_count: number;
  created_at: string;
}

export interface CreateTripPayload {
  title: string;
  city: string;
  city_lat: number;
  city_lng: number;
  date_from: string;
  date_to: string;
  pace: TripPace;
}

export interface TripCreateResult {
  uuid: string;
}

export interface TripShareResult {
  uuid?: string | null;
  share_slug?: string | null;
  share_url?: string | null;
}

export interface TripCityOption {
  city: string;
  displayName: string;
  lat: number;
  lng: number;
}

export interface UpdateTripPayload {
  title?: string | null;
  city?: string | null;
  city_lat?: number | null;
  city_lng?: number | null;
  date_from?: string | null;
  date_to?: string | null;
  pace?: TripPace | null;
}
