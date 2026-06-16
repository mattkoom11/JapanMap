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
