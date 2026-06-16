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
