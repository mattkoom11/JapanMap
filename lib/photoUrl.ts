const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY!;

// photoReference is the `name` field from Places API photo object
// e.g. "places/ChIJ.../photos/AXCi2y..."
export function buildPhotoUrl(photoReference: string, maxWidth = 800): string {
  return `https://places.googleapis.com/v1/${photoReference}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;
}
