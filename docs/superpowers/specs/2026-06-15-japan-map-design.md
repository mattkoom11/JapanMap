# Japan Map App — Design Spec
**Date:** 2026-06-15

## Overview

A personal-use iPhone app built around an interactive map of Japan. The user discovers places (vintage/thrift stores, restaurants, cafes, museums, general POIs) via Google Places search, saves curated picks to a personal collection, and navigates that collection through a filter panel organized by category, region, prefecture, and city.

---

## Stack

| Layer | Technology |
|---|---|
| App framework | Expo (React Native) with TypeScript |
| Map renderer | react-native-maps — Google Maps provider |
| Place discovery | Google Places API (New) |
| Photos | Google Places Photos API (photo references, not full URLs) |
| Database | Supabase (Postgres) |
| State management | Zustand |
| Navigation | Expo Router (stack) |

---

## Architecture

```
iPhone (Expo)
  ├── react-native-maps (Google Maps SDK)
  ├── Google Places API  →  search + photos
  └── Supabase client    →  saved collection

Supabase (Postgres)
  └── places table       →  all saved spots
```

Google Places is a **discovery tool only** — raw search results never appear on the main map. Only explicitly saved places are stored in Supabase and shown as pins.

---

## Screens

### 1. Map (Home)
- Fullscreen Google Map centered on Japan
- Saved places rendered as category-colored pins
- Floating search button (top or bottom right)
- Filter badge showing active filter count (e.g. "3 filters")
- Filter bottom sheet (two snap points: collapsed / half-screen)

### 2. Search
- Text input + category selector (vintage / restaurant / cafe / museum / poi)
- Google Places results as a list + temporary pins on map
- Tap result → Place Preview bottom sheet (name, address, category, one photo, Save button)
- Save writes to Supabase; pin becomes permanent

### 3. Place Detail
- Opened by tapping a saved pin on the map
- Photo carousel (Google Places photos)
- Name, category badge, prefecture/city
- Visited / Want to Visit toggle
- 1–5 star ranking (only tappable when `visited = true`)
- Address + deep link to Apple Maps / Google Maps
- Long press on pin (or swipe) → delete option

---

## Data Model

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
  city             text,           -- nullable; only set for Tokyo, Osaka, Kyoto, Sapporo
  visited          boolean NOT NULL DEFAULT false,
  ranking          int CHECK (ranking BETWEEN 1 AND 5),  -- nullable until visited
  photo_references jsonb,          -- array of Google photo reference strings
  created_at       timestamptz NOT NULL DEFAULT now()
);
```

**Key decisions:**
- `google_place_id` unique constraint prevents duplicate saves
- `region` and `prefecture` are derived from Google Places response on save — never entered manually
- `ranking` is nullable; UI enforces it is only settable when `visited = true`
- `photo_references` stores reference tokens (not expiring URLs); resolved to URLs at display time

---

## Filter Panel

Bottom sheet with two snap points (collapsed / half-screen).

```
[ Category ]   vintage  restaurant  cafe  museum  poi    (pill toggles, multi-select)

[ Scope ]      All Japan  |  Region  |  Prefecture  |  City   (tab selector)

[ Value ]      shown only when Scope ≠ All Japan
               Region      → 8 region buttons
               Prefecture  → scrollable list of 47
               City        → Tokyo / Osaka / Kyoto / Sapporo
```

- Filters apply instantly; map pins update in real time
- Narrowing scope animates the map camera to fit the selected area
- "Clear all" resets to full Japan view

---

## Regions & Cities Reference

**8 Geographic Regions:**
1. Hokkaido & Tohoku
2. Kanto (incl. Tokyo)
3. Chubu
4. Kinki / Kansai (incl. Osaka, Kyoto)
5. Chugoku
6. Shikoku
7. Kyushu
8. Okinawa

**4 Main Cities:**
- Tokyo (Kanto)
- Osaka (Kinki)
- Kyoto (Kinki)
- Sapporo (Hokkaido & Tohoku)

---

## Prefecture → Region Mapping

Google Places returns `administrative_area_level_1` (prefecture name in English) but not a region. The app includes a hardcoded lookup table mapping all 47 prefectures to their region:

| Region | Prefectures |
|---|---|
| hokkaido_tohoku | Hokkaido, Aomori, Iwate, Miyagi, Akita, Yamagata, Fukushima |
| kanto | Ibaraki, Tochigi, Gunma, Saitama, Chiba, Tokyo, Kanagawa |
| chubu | Niigata, Toyama, Ishikawa, Fukui, Yamanashi, Nagano, Gifu, Shizuoka, Aichi |
| kinki | Mie, Shiga, Kyoto, Osaka, Hyogo, Nara, Wakayama |
| chugoku | Tottori, Shimane, Okayama, Hiroshima, Yamaguchi |
| shikoku | Tokushima, Kagawa, Ehime, Kochi |
| kyushu | Fukuoka, Saga, Nagasaki, Kumamoto, Oita, Miyazaki, Kagoshima |
| okinawa | Okinawa |

This mapping is applied client-side when saving a place, before writing to Supabase.

---

## Place Categories

| Value | Display | Google Places search type hint |
|---|---|---|
| `vintage` | Vintage / Thrift | "thrift store", "vintage clothing" |
| `restaurant` | Restaurant | `restaurant` |
| `cafe` | Cafe | `cafe` |
| `museum` | Museum | `museum` |
| `poi` | Point of Interest | `tourist_attraction`, `point_of_interest` |

---

## Key Constraints & Decisions

- **Personal use only** — no auth, no multi-user, no public sharing. Supabase used with a single anon key scoped to this app.
- **No manual data entry** — all place metadata (name, coordinates, region, prefecture, photos) comes from Google Places.
- **Rankings require a visit** — the UI prevents rating an unvisited place.
- **Photo references, not URLs** — Google Places photo URLs expire; storing references and resolving them at render time is the correct pattern.
- **No offline mode** — out of scope for v1.
