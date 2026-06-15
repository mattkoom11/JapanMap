# Japan Map App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal iPhone app for discovering and curating Japanese places (vintage shops, restaurants, cafes, museums, POIs) on an interactive Google Map, organized by region, prefecture, city, and neighborhood.

**Architecture:** Expo (React Native + TypeScript) with react-native-maps (Google Maps provider) for the map, Google Places API (New) for place discovery and photos, and Supabase (Postgres) for the personal saved collection. Zustand manages filter state and the places list client-side.

**Tech Stack:** Expo SDK 52+, Expo Router, react-native-maps, @gorhom/bottom-sheet, @supabase/supabase-js, zustand, TypeScript

---

## File Structure

```
app/
  _layout.tsx                  # Root Expo Router layout (gesture handler, reanimated)
  index.tsx                    # Map screen (home)
  search.tsx                   # Search screen
  place/[id].tsx               # Place Detail screen

components/
  JapanMapView.tsx             # Fullscreen MapView with saved place pins
  CategoryPin.tsx              # Colored marker per category
  FilterBottomSheet.tsx        # Bottom sheet (2 snap points) with all filter UI
  CategoryToggles.tsx          # Multi-select pill toggles for category
  ScopeSelector.tsx            # Tab selector: All Japan / Region / Prefecture / City / Neighborhood
  ScopeValueSelector.tsx       # Dynamic list rendered based on active scope
  PlacePreviewSheet.tsx        # Bottom sheet shown after tapping a search result
  PhotoCarousel.tsx            # Horizontal photo scroll from Google Places
  VisitedToggle.tsx            # Visited / Want to Visit toggle
  StarRanking.tsx              # 1–5 star tap selector

lib/
  supabase.ts                  # Supabase client singleton
  googlePlaces.ts              # Google Places API (New) fetch wrapper
  regionMapping.ts             # Prefecture name → region_enum lookup
  photoUrl.ts                  # Resolve photo reference string → fetch URL

store/
  usePlacesStore.ts            # Zustand: saved places array + loadPlaces / savePlace / deletePlace / updatePlace
  useFilterStore.ts            # Zustand: active categories, scope, scope value

types/
  index.ts                     # Shared TS types: Place, Category, Region, Scope, FilterState

supabase/
  migrations/
    0001_initial.sql           # CREATE TYPE + CREATE TABLE places

constants/
  regions.ts                   # Region enum values, display names, bounding boxes
  cities.ts                    # 4 main cities with bounding boxes
  categories.ts                # Category enum values + display labels + colors
```

---

## Task 1: Bootstrap Expo Project

**Files:**
- Create: `app.json`
- Create: `package.json` (via `npx create-expo-app`)

- [ ] **Step 1: Scaffold Expo app**

Run from `C:\JapanMap`:
```bash
npx create-expo-app@latest . --template blank-typescript
```
Expected: Expo project created with `app/`, `package.json`, `tsconfig.json`.

- [ ] **Step 2: Install dependencies**

```bash
npx expo install react-native-maps expo-router @supabase/supabase-js zustand @gorhom/bottom-sheet react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-screens
```

- [ ] **Step 3: Configure Expo Router in app.json**

Replace contents of `app.json`:
```json
{
  "expo": {
    "name": "JapanMap",
    "slug": "japan-map",
    "version": "1.0.0",
    "scheme": "japanmap",
    "platforms": ["ios"],
    "ios": {
      "bundleIdentifier": "com.personal.japanmap",
      "config": {
        "googleMapsApiKey": ""
      }
    },
    "plugins": [
      "expo-router",
      [
        "react-native-maps",
        {
          "googleMapsApiKey": ""
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```
Note: API key placeholders filled in Task 3.

- [ ] **Step 4: Create .env file**

Create `.env` in project root:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=
```

- [ ] **Step 5: Add .env to .gitignore**

```bash
echo ".env" >> .gitignore
echo "node_modules/" >> .gitignore
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: bootstrap Expo project with dependencies"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `types/index.ts`
- Create: `constants/categories.ts`
- Create: `constants/regions.ts`
- Create: `constants/cities.ts`

- [ ] **Step 1: Create types/index.ts**

```typescript
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
```

- [ ] **Step 2: Create constants/categories.ts**

```typescript
import { Category } from '../types';

export const CATEGORIES: {
  value: Category;
  label: string;
  color: string;
  googleTypes: string[];
}[] = [
  { value: 'vintage',    label: 'Vintage',    color: '#8B6F4E', googleTypes: ['clothing_store', 'second_hand_store'] },
  { value: 'restaurant', label: 'Restaurant', color: '#C0392B', googleTypes: ['restaurant'] },
  { value: 'cafe',       label: 'Cafe',       color: '#D4AC0D', googleTypes: ['cafe'] },
  { value: 'museum',     label: 'Museum',     color: '#1A5276', googleTypes: ['museum'] },
  { value: 'poi',        label: 'POI',        color: '#117A65', googleTypes: ['tourist_attraction', 'point_of_interest'] },
];

export const CATEGORY_COLOR: Record<Category, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.color])
) as Record<Category, string>;
```

- [ ] **Step 3: Create constants/regions.ts**

```typescript
import { Region } from '../types';

export const REGIONS: {
  value: Region;
  label: string;
  // SW lat, SW lng, NE lat, NE lng
  bounds: { sw: [number, number]; ne: [number, number] };
}[] = [
  { value: 'hokkaido_tohoku', label: 'Hokkaido & Tohoku', bounds: { sw: [36.9, 139.3], ne: [45.6, 145.9] } },
  { value: 'kanto',           label: 'Kanto',             bounds: { sw: [35.0, 138.4], ne: [37.0, 140.9] } },
  { value: 'chubu',           label: 'Chubu',             bounds: { sw: [34.5, 136.2], ne: [37.7, 138.9] } },
  { value: 'kinki',           label: 'Kinki / Kansai',    bounds: { sw: [33.4, 134.9], ne: [35.7, 136.6] } },
  { value: 'chugoku',         label: 'Chugoku',           bounds: { sw: [34.0, 131.0], ne: [35.7, 134.5] } },
  { value: 'shikoku',         label: 'Shikoku',           bounds: { sw: [32.9, 132.2], ne: [34.2, 134.8] } },
  { value: 'kyushu',          label: 'Kyushu',            bounds: { sw: [31.0, 129.5], ne: [34.0, 131.8] } },
  { value: 'okinawa',         label: 'Okinawa',           bounds: { sw: [24.0, 122.9], ne: [27.1, 128.4] } },
];
```

- [ ] **Step 4: Create constants/cities.ts**

```typescript
export const MAIN_CITIES: {
  value: string;
  label: string;
  lat: number;
  lng: number;
  bounds: { sw: [number, number]; ne: [number, number] };
}[] = [
  { value: 'Tokyo',   label: 'Tokyo',   lat: 35.6762, lng: 139.6503, bounds: { sw: [35.52, 139.35], ne: [35.82, 139.92] } },
  { value: 'Osaka',   label: 'Osaka',   lat: 34.6937, lng: 135.5023, bounds: { sw: [34.58, 135.38], ne: [34.82, 135.64] } },
  { value: 'Kyoto',   label: 'Kyoto',   lat: 35.0116, lng: 135.7681, bounds: { sw: [34.89, 135.64], ne: [35.14, 135.90] } },
  { value: 'Sapporo', label: 'Sapporo', lat: 43.0618, lng: 141.3545, bounds: { sw: [42.96, 141.20], ne: [43.18, 141.55] } },
];

export const MAIN_CITY_NAMES = MAIN_CITIES.map((c) => c.value);
```

- [ ] **Step 5: Commit**

```bash
git add types/ constants/
git commit -m "feat: add TypeScript types and constants"
```

---

## Task 3: Supabase Setup + Migration

**Files:**
- Create: `supabase/migrations/0001_initial.sql`
- Create: `lib/supabase.ts`

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com, create a new project. Copy:
- Project URL → `EXPO_PUBLIC_SUPABASE_URL` in `.env`
- Anon public key → `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`

- [ ] **Step 2: Write migration SQL**

Create `supabase/migrations/0001_initial.sql`:
```sql
CREATE TYPE category_enum AS ENUM ('vintage', 'restaurant', 'cafe', 'museum', 'poi');

CREATE TYPE region_enum AS ENUM (
  'hokkaido_tohoku', 'kanto', 'chubu', 'kinki',
  'chugoku', 'shikoku', 'kyushu', 'okinawa'
);

CREATE TABLE places (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id  text UNIQUE NOT NULL,
  name             text NOT NULL,
  lat              float NOT NULL,
  lng              float NOT NULL,
  category         category_enum NOT NULL,
  region           region_enum NOT NULL,
  prefecture       text NOT NULL,
  city             text,
  neighborhood     text,
  visited          boolean NOT NULL DEFAULT false,
  ranking          int CHECK (ranking BETWEEN 1 AND 5),
  photo_references jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Step 3: Run migration in Supabase**

In the Supabase dashboard → SQL Editor → paste the contents of `0001_initial.sql` → Run.

Expected: No errors. Table `places` appears in Table Editor.

- [ ] **Step 4: Create lib/supabase.ts**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 5: Configure app.json with Google Maps API key**

Get a Google Maps API key from Google Cloud Console (enable: Maps SDK for iOS, Places API (New), Maps JavaScript API).

In `.env`:
```
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_key_here
```

In `app.json`, set:
```json
"ios": {
  "bundleIdentifier": "com.personal.japanmap",
  "config": {
    "googleMapsApiKey": "your_key_here"
  }
}
```
And in the `react-native-maps` plugin array:
```json
["react-native-maps", { "googleMapsApiKey": "your_key_here" }]
```

- [ ] **Step 6: Commit**

```bash
git add supabase/ lib/supabase.ts app.json
git commit -m "feat: Supabase client and initial migration"
```

---

## Task 4: Utilities (Region Mapping + Photo URL)

**Files:**
- Create: `lib/regionMapping.ts`
- Create: `lib/photoUrl.ts`

- [ ] **Step 1: Create lib/regionMapping.ts**

```typescript
import { Region } from '../types';

const PREFECTURE_TO_REGION: Record<string, Region> = {
  Hokkaido: 'hokkaido_tohoku',
  Aomori: 'hokkaido_tohoku',
  Iwate: 'hokkaido_tohoku',
  Miyagi: 'hokkaido_tohoku',
  Akita: 'hokkaido_tohoku',
  Yamagata: 'hokkaido_tohoku',
  Fukushima: 'hokkaido_tohoku',
  Ibaraki: 'kanto',
  Tochigi: 'kanto',
  Gunma: 'kanto',
  Saitama: 'kanto',
  Chiba: 'kanto',
  Tokyo: 'kanto',
  Kanagawa: 'kanto',
  Niigata: 'chubu',
  Toyama: 'chubu',
  Ishikawa: 'chubu',
  Fukui: 'chubu',
  Yamanashi: 'chubu',
  Nagano: 'chubu',
  Gifu: 'chubu',
  Shizuoka: 'chubu',
  Aichi: 'chubu',
  Mie: 'kinki',
  Shiga: 'kinki',
  Kyoto: 'kinki',
  Osaka: 'kinki',
  Hyogo: 'kinki',
  Nara: 'kinki',
  Wakayama: 'kinki',
  Tottori: 'chugoku',
  Shimane: 'chugoku',
  Okayama: 'chugoku',
  Hiroshima: 'chugoku',
  Yamaguchi: 'chugoku',
  Tokushima: 'shikoku',
  Kagawa: 'shikoku',
  Ehime: 'shikoku',
  Kochi: 'shikoku',
  Fukuoka: 'kyushu',
  Saga: 'kyushu',
  Nagasaki: 'kyushu',
  Kumamoto: 'kyushu',
  Oita: 'kyushu',
  Miyazaki: 'kyushu',
  Kagoshima: 'kyushu',
  Okinawa: 'okinawa',
};

export function prefectureToRegion(prefecture: string): Region {
  return PREFECTURE_TO_REGION[prefecture] ?? 'kanto';
}
```

- [ ] **Step 2: Write test for regionMapping**

Create `lib/__tests__/regionMapping.test.ts`:
```typescript
import { prefectureToRegion } from '../regionMapping';

test('Tokyo maps to kanto', () => {
  expect(prefectureToRegion('Tokyo')).toBe('kanto');
});

test('Osaka maps to kinki', () => {
  expect(prefectureToRegion('Osaka')).toBe('kinki');
});

test('Hokkaido maps to hokkaido_tohoku', () => {
  expect(prefectureToRegion('Hokkaido')).toBe('hokkaido_tohoku');
});

test('Okinawa maps to okinawa', () => {
  expect(prefectureToRegion('Okinawa')).toBe('okinawa');
});
```

- [ ] **Step 3: Run tests**

```bash
npx jest lib/__tests__/regionMapping.test.ts
```
Expected: 4 tests pass.

- [ ] **Step 4: Create lib/photoUrl.ts**

```typescript
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY!;

// photoReference is the `name` field from Places API photo object
// e.g. "places/ChIJ.../photos/AXCi2y..."
export function buildPhotoUrl(photoReference: string, maxWidth = 800): string {
  return `https://places.googleapis.com/v1/${photoReference}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/
git commit -m "feat: region mapping and photo URL utilities"
```

---

## Task 5: Google Places API Wrapper

**Files:**
- Create: `lib/googlePlaces.ts`

- [ ] **Step 1: Create lib/googlePlaces.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/googlePlaces.ts
git commit -m "feat: Google Places API wrapper"
```

---

## Task 6: Zustand Stores

**Files:**
- Create: `store/usePlacesStore.ts`
- Create: `store/useFilterStore.ts`

- [ ] **Step 1: Create store/usePlacesStore.ts**

```typescript
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Place, Category } from '../types';

interface PlacesStore {
  places: Place[];
  loading: boolean;
  loadPlaces: () => Promise<void>;
  savePlace: (place: Omit<Place, 'id' | 'created_at'>) => Promise<void>;
  updatePlace: (id: string, updates: Partial<Pick<Place, 'visited' | 'ranking'>>) => Promise<void>;
  deletePlace: (id: string) => Promise<void>;
}

export const usePlacesStore = create<PlacesStore>((set, get) => ({
  places: [],
  loading: false,

  loadPlaces: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) set({ places: data as Place[] });
    set({ loading: false });
  },

  savePlace: async (place) => {
    const { data, error } = await supabase
      .from('places')
      .insert(place)
      .select()
      .single();
    if (!error && data) {
      set((s) => ({ places: [data as Place, ...s.places] }));
    }
  },

  updatePlace: async (id, updates) => {
    const { data, error } = await supabase
      .from('places')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      set((s) => ({
        places: s.places.map((p) => (p.id === id ? (data as Place) : p)),
      }));
    }
  },

  deletePlace: async (id) => {
    const { error } = await supabase.from('places').delete().eq('id', id);
    if (!error) {
      set((s) => ({ places: s.places.filter((p) => p.id !== id) }));
    }
  },
}));
```

- [ ] **Step 2: Create store/useFilterStore.ts**

```typescript
import { create } from 'zustand';
import { Category, Scope, FilterState } from '../types';
import { Place } from '../types';

interface FilterStore extends FilterState {
  setCategories: (categories: Category[]) => void;
  toggleCategory: (category: Category) => void;
  setScope: (scope: Scope) => void;
  setScopeValue: (value: string | null) => void;
  clearAll: () => void;
  applyFilters: (places: Place[]) => Place[];
  distinctNeighborhoods: (places: Place[]) => string[];
}

const DEFAULT: FilterState = {
  categories: [],
  scope: 'all',
  scopeValue: null,
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...DEFAULT,

  setCategories: (categories) => set({ categories }),

  toggleCategory: (category) => {
    const { categories } = get();
    const next = categories.includes(category)
      ? categories.filter((c) => c !== category)
      : [...categories, category];
    set({ categories: next });
  },

  setScope: (scope) => set({ scope, scopeValue: null }),

  setScopeValue: (scopeValue) => set({ scopeValue }),

  clearAll: () => set({ ...DEFAULT }),

  applyFilters: (places) => {
    const { categories, scope, scopeValue } = get();
    return places.filter((p) => {
      if (categories.length > 0 && !categories.includes(p.category)) return false;
      if (scope === 'region' && scopeValue && p.region !== scopeValue) return false;
      if (scope === 'prefecture' && scopeValue && p.prefecture !== scopeValue) return false;
      if (scope === 'city' && scopeValue && p.city !== scopeValue) return false;
      if (scope === 'neighborhood' && scopeValue && p.neighborhood !== scopeValue) return false;
      return true;
    });
  },

  distinctNeighborhoods: (places) => {
    const set = new Set(places.map((p) => p.neighborhood).filter(Boolean) as string[]);
    return Array.from(set).sort();
  },
}));
```

- [ ] **Step 3: Commit**

```bash
git add store/
git commit -m "feat: Zustand stores for places and filters"
```

---

## Task 7: App Layout + Navigation

**Files:**
- Create: `app/_layout.tsx`

- [ ] **Step 1: Create app/_layout.tsx**

```typescript
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: root layout with gesture handler"
```

---

## Task 8: CategoryPin + JapanMapView

**Files:**
- Create: `components/CategoryPin.tsx`
- Create: `components/JapanMapView.tsx`

- [ ] **Step 1: Create components/CategoryPin.tsx**

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Category } from '../types';
import { CATEGORY_COLOR } from '../constants/categories';

interface Props {
  coordinate: { latitude: number; longitude: number };
  category: Category;
  onPress: () => void;
}

export function CategoryPin({ coordinate, category, onPress }: Props) {
  return (
    <Marker coordinate={coordinate} onPress={onPress}>
      <View style={[styles.pin, { backgroundColor: CATEGORY_COLOR[category] }]} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
```

- [ ] **Step 2: Create components/JapanMapView.tsx**

```typescript
import React, { forwardRef } from 'react';
import MapView, { MapViewProps, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { CategoryPin } from './CategoryPin';
import { Place } from '../types';

const JAPAN_REGION = {
  latitude: 37.0,
  longitude: 137.0,
  latitudeDelta: 15.0,
  longitudeDelta: 15.0,
};

interface Props extends Partial<MapViewProps> {
  places: Place[];
  onPinPress: (place: Place) => void;
}

export const JapanMapView = forwardRef<MapView, Props>(
  ({ places, onPinPress, ...rest }, ref) => {
    return (
      <MapView
        ref={ref}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={JAPAN_REGION}
        {...rest}
      >
        {places.map((place) => (
          <CategoryPin
            key={place.id}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            category={place.category}
            onPress={() => onPinPress(place)}
          />
        ))}
      </MapView>
    );
  }
);

const styles = StyleSheet.create({
  map: { flex: 1 },
});
```

- [ ] **Step 3: Commit**

```bash
git add components/CategoryPin.tsx components/JapanMapView.tsx
git commit -m "feat: map view with category-colored pins"
```

---

## Task 9: Filter Panel

**Files:**
- Create: `components/CategoryToggles.tsx`
- Create: `components/ScopeSelector.tsx`
- Create: `components/ScopeValueSelector.tsx`
- Create: `components/FilterBottomSheet.tsx`

- [ ] **Step 1: Create components/CategoryToggles.tsx**

```typescript
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Category } from '../types';
import { CATEGORIES, CATEGORY_COLOR } from '../constants/categories';

interface Props {
  selected: Category[];
  onToggle: (category: Category) => void;
}

export function CategoryToggles({ selected, onToggle }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
      {CATEGORIES.map((cat) => {
        const active = selected.includes(cat.value);
        return (
          <TouchableOpacity
            key={cat.value}
            onPress={() => onToggle(cat.value)}
            style={[
              styles.pill,
              active && { backgroundColor: CATEGORY_COLOR[cat.value] },
            ]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 12 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  label: { fontSize: 13, color: '#444' },
  activeLabel: { color: '#fff', fontWeight: '600' },
});
```

- [ ] **Step 2: Create components/ScopeSelector.tsx**

```typescript
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Scope } from '../types';

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'all',          label: 'All Japan' },
  { value: 'region',       label: 'Region' },
  { value: 'prefecture',   label: 'Prefecture' },
  { value: 'city',         label: 'City' },
  { value: 'neighborhood', label: 'Neighborhood' },
];

interface Props {
  scope: Scope;
  onSelect: (scope: Scope) => void;
}

export function ScopeSelector({ scope, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {SCOPES.map((s) => (
        <TouchableOpacity
          key={s.value}
          onPress={() => onSelect(s.value)}
          style={[styles.tab, scope === s.value && styles.activeTab]}
        >
          <Text style={[styles.label, scope === s.value && styles.activeLabel]}>
            {s.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  activeTab: { backgroundColor: '#222' },
  label: { fontSize: 12, color: '#444' },
  activeLabel: { color: '#fff', fontWeight: '600' },
});
```

- [ ] **Step 3: Create components/ScopeValueSelector.tsx**

```typescript
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Scope } from '../types';
import { REGIONS } from '../constants/regions';
import { MAIN_CITIES } from '../constants/cities';

const PREFECTURES = [
  'Hokkaido','Aomori','Iwate','Miyagi','Akita','Yamagata','Fukushima',
  'Ibaraki','Tochigi','Gunma','Saitama','Chiba','Tokyo','Kanagawa',
  'Niigata','Toyama','Ishikawa','Fukui','Yamanashi','Nagano','Gifu',
  'Shizuoka','Aichi','Mie','Shiga','Kyoto','Osaka','Hyogo','Nara',
  'Wakayama','Tottori','Shimane','Okayama','Hiroshima','Yamaguchi',
  'Tokushima','Kagawa','Ehime','Kochi','Fukuoka','Saga','Nagasaki',
  'Kumamoto','Oita','Miyazaki','Kagoshima','Okinawa',
];

interface Props {
  scope: Scope;
  scopeValue: string | null;
  neighborhoods: string[];
  onSelect: (value: string) => void;
}

export function ScopeValueSelector({ scope, scopeValue, neighborhoods, onSelect }: Props) {
  if (scope === 'all') return null;

  const items: { value: string; label: string }[] =
    scope === 'region'
      ? REGIONS.map((r) => ({ value: r.value, label: r.label }))
      : scope === 'prefecture'
      ? PREFECTURES.map((p) => ({ value: p, label: p }))
      : scope === 'city'
      ? MAIN_CITIES.map((c) => ({ value: c.value, label: c.label }))
      : neighborhoods.map((n) => ({ value: n, label: n }));

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.value}
          onPress={() => onSelect(item.value)}
          style={[styles.item, scopeValue === item.value && styles.activeItem]}
        >
          <Text style={[styles.label, scopeValue === item.value && styles.activeLabel]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 200 },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  activeItem: { backgroundColor: '#f5f5f5' },
  label: { fontSize: 14, color: '#333' },
  activeLabel: { fontWeight: '600', color: '#111' },
});
```

- [ ] **Step 4: Create components/FilterBottomSheet.tsx**

```typescript
import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { CategoryToggles } from './CategoryToggles';
import { ScopeSelector } from './ScopeSelector';
import { ScopeValueSelector } from './ScopeValueSelector';
import { useFilterStore } from '../store/useFilterStore';
import { usePlacesStore } from '../store/usePlacesStore';

export function FilterBottomSheet() {
  const { categories, scope, scopeValue, toggleCategory, setScope, setScopeValue, clearAll, distinctNeighborhoods } = useFilterStore();
  const { places } = usePlacesStore();
  const snapPoints = useMemo(() => [60, '50%'], []);
  const neighborhoods = distinctNeighborhoods(places);

  const activeCount =
    categories.length + (scope !== 'all' && scopeValue ? 1 : 0);

  return (
    <BottomSheet snapPoints={snapPoints} index={0}>
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Filter</Text>
          {activeCount > 0 && (
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clear}>Clear all ({activeCount})</Text>
            </TouchableOpacity>
          )}
        </View>
        <CategoryToggles selected={categories} onToggle={toggleCategory} />
        <ScopeSelector scope={scope} onSelect={setScope} />
        <ScopeValueSelector
          scope={scope}
          scopeValue={scopeValue}
          neighborhoods={neighborhoods}
          onSelect={setScopeValue}
        />
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600' },
  clear: { fontSize: 13, color: '#888' },
});
```

- [ ] **Step 5: Commit**

```bash
git add components/CategoryToggles.tsx components/ScopeSelector.tsx components/ScopeValueSelector.tsx components/FilterBottomSheet.tsx
git commit -m "feat: filter panel with category, scope, and value selectors"
```

---

## Task 10: Map Screen (Home)

**Files:**
- Create: `app/index.tsx`

- [ ] **Step 1: Create app/index.tsx**

```typescript
import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import MapView from 'react-native-maps';
import { JapanMapView } from '../components/JapanMapView';
import { FilterBottomSheet } from '../components/FilterBottomSheet';
import { usePlacesStore } from '../store/usePlacesStore';
import { useFilterStore } from '../store/useFilterStore';
import { Place } from '../types';
import { REGIONS } from '../constants/regions';
import { MAIN_CITIES } from '../constants/cities';

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { places, loadPlaces } = usePlacesStore();
  const { applyFilters, scope, scopeValue, categories } = useFilterStore();

  useEffect(() => {
    loadPlaces();
  }, []);

  // Animate camera when scope/scopeValue changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (scope === 'all') {
      mapRef.current.animateToRegion(
        { latitude: 37.0, longitude: 137.0, latitudeDelta: 15, longitudeDelta: 15 },
        600
      );
      return;
    }
    if (scope === 'region' && scopeValue) {
      const region = REGIONS.find((r) => r.value === scopeValue);
      if (region) {
        mapRef.current.fitToCoordinates(
          [
            { latitude: region.bounds.sw[0], longitude: region.bounds.sw[1] },
            { latitude: region.bounds.ne[0], longitude: region.bounds.ne[1] },
          ],
          { edgePadding: { top: 40, right: 40, bottom: 300, left: 40 }, animated: true }
        );
      }
    }
    if (scope === 'city' && scopeValue) {
      const city = MAIN_CITIES.find((c) => c.value === scopeValue);
      if (city) {
        mapRef.current.fitToCoordinates(
          [
            { latitude: city.bounds.sw[0], longitude: city.bounds.sw[1] },
            { latitude: city.bounds.ne[0], longitude: city.bounds.ne[1] },
          ],
          { edgePadding: { top: 40, right: 40, bottom: 300, left: 40 }, animated: true }
        );
      }
    }
    if ((scope === 'prefecture' || scope === 'neighborhood') && scopeValue) {
      const filtered = applyFilters(places);
      if (filtered.length > 0) {
        mapRef.current.fitToCoordinates(
          filtered.map((p) => ({ latitude: p.lat, longitude: p.lng })),
          { edgePadding: { top: 40, right: 40, bottom: 300, left: 40 }, animated: true }
        );
      }
    }
  }, [scope, scopeValue]);

  const filtered = applyFilters(places);
  const activeCount = categories.length + (scope !== 'all' && scopeValue ? 1 : 0);

  const handlePinPress = (place: Place) => {
    router.push(`/place/${place.id}`);
  };

  return (
    <View style={styles.container}>
      <JapanMapView ref={mapRef} places={filtered} onPinPress={handlePinPress} />

      <TouchableOpacity style={styles.searchButton} onPress={() => router.push('/search')}>
        <Text style={styles.searchText}>Search places...</Text>
      </TouchableOpacity>

      {activeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeCount} filter{activeCount > 1 ? 's' : ''}</Text>
        </View>
      )}

      <FilterBottomSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  searchText: { color: '#999', fontSize: 15 },
  badge: {
    position: 'absolute',
    bottom: 72,
    alignSelf: 'center',
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgeText: { color: '#fff', fontSize: 12 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/index.tsx
git commit -m "feat: map home screen with camera animation on filter change"
```

---

## Task 11: Place Preview Sheet + Search Screen

**Files:**
- Create: `components/PlacePreviewSheet.tsx`
- Create: `app/search.tsx`

- [ ] **Step 1: Create components/PlacePreviewSheet.tsx**

```typescript
import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GooglePlaceResult, Category } from '../types';
import { buildPhotoUrl } from '../lib/photoUrl';
import { CATEGORIES } from '../constants/categories';

interface Props {
  result: GooglePlaceResult | null;
  category: Category;
  onSave: () => void;
  onDismiss: () => void;
  saving: boolean;
}

export function PlacePreviewSheet({ result, category, onSave, onDismiss, saving }: Props) {
  const snapPoints = useMemo(() => ['40%'], []);
  const catLabel = CATEGORIES.find((c) => c.value === category)?.label ?? category;
  const photoUrl = result?.photos?.[0]
    ? buildPhotoUrl(result.photos[0].name)
    : null;

  if (!result) return null;

  return (
    <BottomSheet snapPoints={snapPoints} onClose={onDismiss} enablePanDownToClose>
      <BottomSheetView style={styles.content}>
        {photoUrl && (
          <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
        )}
        <Text style={styles.name}>{result.displayName.text}</Text>
        <Text style={styles.address}>{result.formattedAddress}</Text>
        <Text style={styles.cat}>{catLabel}</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save to collection</Text>
          )}
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16 },
  photo: { width: '100%', height: 140, borderRadius: 8, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  address: { fontSize: 13, color: '#666', marginBottom: 4 },
  cat: { fontSize: 12, color: '#999', marginBottom: 16 },
  saveBtn: {
    backgroundColor: '#222',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
```

- [ ] **Step 2: Create app/search.tsx**

```typescript
import React, { useState } from 'react';
import {
  View, TextInput, FlatList, Text, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Category, GooglePlaceResult } from '../types';
import { CATEGORIES } from '../constants/categories';
import { searchPlaces, extractAddressComponent } from '../lib/googlePlaces';
import { prefectureToRegion } from '../lib/regionMapping';
import { MAIN_CITY_NAMES } from '../constants/cities';
import { usePlacesStore } from '../store/usePlacesStore';
import { PlacePreviewSheet } from '../components/PlacePreviewSheet';

export default function SearchScreen() {
  const router = useRouter();
  const { savePlace } = usePlacesStore();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('vintage');
  const [results, setResults] = useState<GooglePlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<GooglePlaceResult | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await searchPlaces(query, category);
      setResults(res);
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);

    const prefecture =
      extractAddressComponent(selected, 'administrative_area_level_1') ?? 'Tokyo';
    const rawCity =
      extractAddressComponent(selected, 'locality') ??
      extractAddressComponent(selected, 'administrative_area_level_2');
    const city =
      rawCity && MAIN_CITY_NAMES.includes(rawCity) ? rawCity : null;
    const neighborhood =
      extractAddressComponent(selected, 'sublocality_level_1') ??
      extractAddressComponent(selected, 'sublocality');
    const region = prefectureToRegion(prefecture);
    const photoRefs = (selected.photos ?? []).map((p) => p.name);

    await savePlace({
      google_place_id: selected.id,
      name: selected.displayName.text,
      lat: selected.location.latitude,
      lng: selected.location.longitude,
      category,
      region,
      prefecture,
      city,
      neighborhood: neighborhood ?? null,
      visited: false,
      ranking: null,
      photo_references: photoRefs,
    });

    setSaving(false);
    setSelected(null);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Search Japan..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
      </View>

      <View style={styles.cats}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            onPress={() => setCategory(cat.value)}
            style={[styles.catPill, category === cat.value && { backgroundColor: cat.color }]}
          >
            <Text style={[styles.catLabel, category === cat.value && { color: '#fff' }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {searching ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.result} onPress={() => setSelected(item)}>
              <Text style={styles.resultName}>{item.displayName.text}</Text>
              <Text style={styles.resultAddr}>{item.formattedAddress}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {selected && (
        <PlacePreviewSheet
          result={selected}
          category={category}
          onSave={handleSave}
          onDismiss={() => setSelected(null)}
          saving={saving}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  back: { padding: 4 },
  backText: { fontSize: 15, color: '#007AFF' },
  input: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  cats: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  catLabel: { fontSize: 13, color: '#555' },
  loader: { marginTop: 40 },
  result: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  resultName: { fontSize: 15, fontWeight: '600' },
  resultAddr: { fontSize: 12, color: '#888', marginTop: 2 },
});
```

- [ ] **Step 3: Commit**

```bash
git add components/PlacePreviewSheet.tsx app/search.tsx
git commit -m "feat: search screen and place preview sheet"
```

---

## Task 12: Place Detail Screen

**Files:**
- Create: `components/PhotoCarousel.tsx`
- Create: `components/VisitedToggle.tsx`
- Create: `components/StarRanking.tsx`
- Create: `app/place/[id].tsx`

- [ ] **Step 1: Create components/PhotoCarousel.tsx**

```typescript
import React from 'react';
import { ScrollView, Image, StyleSheet, Dimensions } from 'react-native';
import { buildPhotoUrl } from '../lib/photoUrl';

const { width } = Dimensions.get('window');

interface Props {
  photoReferences: string[];
}

export function PhotoCarousel({ photoReferences }: Props) {
  return (
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
      {photoReferences.map((ref, i) => (
        <Image
          key={i}
          source={{ uri: buildPhotoUrl(ref) }}
          style={styles.photo}
          resizeMode="cover"
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  photo: { width, height: 260 },
});
```

- [ ] **Step 2: Create components/VisitedToggle.tsx**

```typescript
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  visited: boolean;
  onToggle: (visited: boolean) => void;
}

export function VisitedToggle({ visited, onToggle }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.option, visited && styles.activeOption]}
        onPress={() => onToggle(true)}
      >
        <Text style={[styles.label, visited && styles.activeLabel]}>Visited</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.option, !visited && styles.activeOption]}
        onPress={() => onToggle(false)}
      >
        <Text style={[styles.label, !visited && styles.activeLabel]}>Want to Visit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  option: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  activeOption: { backgroundColor: '#222', borderColor: '#222' },
  label: { fontSize: 14, color: '#555' },
  activeLabel: { color: '#fff', fontWeight: '600' },
});
```

- [ ] **Step 3: Create components/StarRanking.tsx**

```typescript
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  ranking: number | null;
  disabled: boolean;
  onRate: (stars: number) => void;
}

export function StarRanking({ ranking, disabled, onRate }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !disabled && onRate(star)}
          disabled={disabled}
        >
          <Text style={[styles.star, ranking != null && star <= ranking && styles.filled]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
      {disabled && <Text style={styles.hint}> (visit first)</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  star: { fontSize: 28, color: '#ddd' },
  filled: { color: '#F4C430' },
  hint: { fontSize: 12, color: '#aaa', marginLeft: 4 },
});
```

- [ ] **Step 4: Create app/place/[id].tsx**

```typescript
import React from 'react';
import {
  View, Text, TouchableOpacity, Alert, StyleSheet,
  ScrollView, Linking, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePlacesStore } from '../../store/usePlacesStore';
import { PhotoCarousel } from '../../components/PhotoCarousel';
import { VisitedToggle } from '../../components/VisitedToggle';
import { StarRanking } from '../../components/StarRanking';
import { CATEGORIES } from '../../constants/categories';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { places, updatePlace, deletePlace } = usePlacesStore();
  const place = places.find((p) => p.id === id);

  if (!place) return null;

  const catColor = CATEGORIES.find((c) => c.value === place.category)?.color ?? '#888';
  const catLabel = CATEGORIES.find((c) => c.value === place.category)?.label ?? place.category;

  const handleDelete = () => {
    Alert.alert('Remove place', `Remove "${place.name}" from your collection?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deletePlace(place.id);
          router.back();
        },
      },
    ]);
  };

  const handleVisitedToggle = (visited: boolean) => {
    updatePlace(place.id, { visited, ranking: visited ? place.ranking : null });
  };

  const handleRate = (stars: number) => {
    updatePlace(place.id, { ranking: stars });
  };

  const openMaps = () => {
    const url = `maps://?q=${encodeURIComponent(place.name)}&ll=${place.lat},${place.lng}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {place.photo_references.length > 0 && (
          <PhotoCarousel photoReferences={place.photo_references} />
        )}

        <View style={styles.body}>
          <View style={styles.row}>
            <Text style={styles.name}>{place.name}</Text>
            <TouchableOpacity onPress={handleDelete}>
              <Text style={styles.deleteBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.catBadge, { backgroundColor: catColor }]}>
            <Text style={styles.catLabel}>{catLabel}</Text>
          </View>

          <Text style={styles.location}>
            {[place.neighborhood, place.city, place.prefecture].filter(Boolean).join(', ')}
          </Text>

          <VisitedToggle visited={place.visited} onToggle={handleVisitedToggle} />

          <StarRanking
            ranking={place.ranking}
            disabled={!place.visited}
            onRate={handleRate}
          />

          <TouchableOpacity style={styles.mapsBtn} onPress={openMaps}>
            <Text style={styles.mapsBtnText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Map</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  body: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 22, fontWeight: '700', flex: 1, marginBottom: 8 },
  deleteBtn: { fontSize: 18, color: '#ccc', padding: 4 },
  catBadge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  catLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  location: { fontSize: 13, color: '#777', marginBottom: 4 },
  mapsBtn: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mapsBtnText: { fontSize: 14, color: '#333' },
  backBtn: { position: 'absolute', top: 52, left: 16, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  backText: { fontSize: 14, color: '#007AFF' },
});
```

- [ ] **Step 5: Commit**

```bash
git add components/PhotoCarousel.tsx components/VisitedToggle.tsx components/StarRanking.tsx app/place/
git commit -m "feat: place detail screen with photos, visited toggle, and star ranking"
```

---

## Task 13: Run on Device + Smoke Test

- [ ] **Step 1: Install Expo Go on iPhone**

From the App Store, install **Expo Go**.

- [ ] **Step 2: Start dev server**

```bash
npx expo start
```

Scan the QR code with your iPhone camera to open in Expo Go.

- [ ] **Step 3: Smoke test checklist**

- [ ] Map loads showing Japan, centered correctly
- [ ] Search button opens search screen
- [ ] Typing "vintage Tokyo" + selecting Vintage category returns results
- [ ] Tapping a result shows the preview sheet with photo + name
- [ ] Tapping "Save to collection" returns to map with a new pin
- [ ] Tapping the pin opens Place Detail
- [ ] Toggling Visited enables the star rating
- [ ] Rating saves and persists after leaving and returning
- [ ] Filter panel slides up from bottom
- [ ] Toggling a category hides/shows matching pins
- [ ] Selecting a Region zooms the map to that region
- [ ] Selecting Neighborhood shows the saved place's neighborhood in the list
- [ ] "Clear all" resets filters
- [ ] Tapping ✕ on Place Detail removes the place after confirmation

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Japan Map app v1"
```
