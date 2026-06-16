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
