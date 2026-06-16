export type Category = 'vintage' | 'restaurant' | 'cafe' | 'museum' | 'poi';

export type Region =
  | 'hokkaido_tohoku'
  | 'kanto'
  | 'chubu'
  | 'kinki'
  | 'chugoku'
  | 'shikoku'
  | 'kyushu'
  | 'okinawa';

export type Scope = 'all' | 'region' | 'prefecture' | 'city' | 'neighborhood';

export interface Place {
  id: string;
  google_place_id: string;
  name: string;
  lat: number;
  lng: number;
  category: Category;
  region: Region;
  prefecture: string;
  city: string | null;
  neighborhood: string | null;
  visited: boolean;
  ranking: number | null;
  photo_references: string[];
  created_at: string;
}

export interface FilterState {
  categories: Category[];   // empty = all
  scope: Scope;
  scopeValue: string | null; // region name, prefecture name, city name, or neighborhood name
}

export interface GooglePlaceResult {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  photos?: { name: string }[];
  addressComponents?: {
    longText: string;
    types: string[];
  }[];
}
