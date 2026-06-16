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
