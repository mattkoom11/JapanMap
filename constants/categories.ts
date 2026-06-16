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
