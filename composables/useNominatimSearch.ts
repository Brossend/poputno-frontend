import { ref } from 'vue';
import type { OsmSearchResult, PlaceCategory } from '~/types/place';

interface NominatimAddress {
  attraction?: string;
  amenity?: string;
  tourism?: string;
  leisure?: string;
  shop?: string;
  road?: string;
  house_number?: string;
  suburb?: string;
  city?: string;
  town?: string;
  municipality?: string;
  state?: string;
  country?: string;
}

interface NominatimResult {
  osm_id: number | string;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  class?: string;
  type?: string;
  address?: NominatimAddress;
}

interface SearchScope {
  city?: string | null;
  center?: { lat: number; lng: number } | null;
}

const normalizeCategory = (result: NominatimResult): PlaceCategory => {
  if (result.class === 'tourism' && result.type === 'museum') {
    return 'museum';
  }

  if (result.class === 'amenity' && ['cafe', 'coffee_shop', 'bakery'].includes(result.type ?? '')) {
    return 'cafe';
  }

  if (result.class === 'amenity' && ['restaurant', 'fast_food', 'food_court'].includes(result.type ?? '')) {
    return 'restaurant';
  }

  if (result.class === 'leisure' && result.type === 'park') {
    return 'park';
  }

  if (result.class === 'tourism' && result.type === 'viewpoint') {
    return 'viewpoint';
  }

  if (result.class === 'shop' || Boolean(result.address?.shop)) {
    return 'shopping';
  }

  if (result.class === 'tourism' && result.type === 'attraction') {
    return 'attraction';
  }

  return 'other';
};

const getResultName = (result: NominatimResult) => (
  result.name
  ?? result.address?.tourism
  ?? result.address?.amenity
  ?? result.address?.leisure
  ?? result.address?.shop
  ?? result.display_name.split(',')[0]?.trim()
  ?? 'Место без названия'
);

const getAddressText = (result: NominatimResult, name: string) => {
  const parts = result.display_name
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  if (parts[0] === name && parts.length > 1) {
    return parts.slice(1).join(', ');
  }

  return result.display_name;
};

const normalizeResult = (result: NominatimResult): OsmSearchResult | null => {
  const lat = Number.parseFloat(result.lat);
  const lng = Number.parseFloat(result.lon);
  const osmId = Number(result.osm_id);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(osmId)) {
    return null;
  }

  const name = getResultName(result);

  return {
    osm_id: osmId,
    display_name: result.display_name,
    name,
    lat,
    lng,
    category: normalizeCategory(result),
    address: getAddressText(result, name),
  };
};

export const useNominatimSearch = () => {
  const results = ref<OsmSearchResult[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  let abortController: AbortController | null = null;
  let requestSequence = 0;

  const clearResults = () => {
    results.value = [];
    error.value = null;
  };

  const abortSearch = () => {
    abortController?.abort();
    abortController = null;
  };

  const searchPlaces = async (query: string, scope?: SearchScope): Promise<OsmSearchResult[]> => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3) {
      clearResults();
      return [];
    }

    abortSearch();

    const currentRequest = ++requestSequence;
    const controller = new AbortController();
    abortController = controller;
    isLoading.value = true;
    error.value = null;

    const normalizedQuery = scope?.city && !trimmedQuery.toLowerCase().includes(scope.city.toLowerCase())
      ? `${trimmedQuery} ${scope.city}`
      : trimmedQuery;

    const queryParams: Record<string, string | number> = {
      q: normalizedQuery,
      format: 'json',
      addressdetails: 1,
      limit: 8,
      'accept-language': 'ru',
    };

    if (scope?.center) {
      const minLon = scope.center.lng - 0.8;
      const maxLon = scope.center.lng + 0.8;
      const minLat = scope.center.lat - 0.45;
      const maxLat = scope.center.lat + 0.45;

      queryParams.viewbox = `${minLon},${maxLat},${maxLon},${minLat}`;
      queryParams.bounded = 1;
    }

    try {
      const response = await $fetch<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
        query: queryParams,
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (currentRequest !== requestSequence) {
        return results.value;
      }

      results.value = response
        .map(normalizeResult)
        .filter((item): item is OsmSearchResult => item !== null);

      return results.value;
    } catch (requestError) {
      if (controller.signal.aborted) {
        return [];
      }

      results.value = [];
      error.value = 'Не удалось найти места. Попробуйте позже.';

      return [];
    } finally {
      if (currentRequest === requestSequence) {
        isLoading.value = false;
      }

      if (abortController === controller) {
        abortController = null;
      }
    }
  };

  return {
    results,
    isLoading,
    error,
    searchPlaces,
    clearResults,
    abortSearch,
  };
};
