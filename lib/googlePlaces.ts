import { Category, GooglePlaceResult } from '../types';
import { CATEGORIES } from '../constants/categories';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY!;
const BASE_URL = 'https://places.googleapis.com/v1';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.photos',
  'places.addressComponents',
].join(',');

export async function searchPlaces(
  query: string,
  category: Category
): Promise<GooglePlaceResult[]> {
  const types = CATEGORIES.find((c) => c.value === category)?.googleTypes ?? [];
  const body: Record<string, unknown> = {
    textQuery: query,
    languageCode: 'en',
    locationBias: {
      rectangle: {
        low: { latitude: 24.0, longitude: 122.9 },
        high: { latitude: 45.6, longitude: 145.9 },
      },
    },
  };
  if (types.length > 0) {
    body.includedType = types[0];
  }

  const res = await fetch(`${BASE_URL}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Places API error: ${res.status}`);
  const data = await res.json();
  return (data.places ?? []) as GooglePlaceResult[];
}

export function extractAddressComponent(
  result: GooglePlaceResult,
  type: string
): string | null {
  return (
    result.addressComponents?.find((c) => c.types.includes(type))?.longText ??
    null
  );
}
