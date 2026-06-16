import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Place, Category } from '../types';

interface PlacesStore {
  places: Place[];
  loading: boolean;
  loadPlaces: () => Promise<void>;
  savePlace: (place: Omit<Place, 'id' | 'created_at'>) => Promise<void>;
  updatePlace: (id: string, updates: Partial<Pick<Place, 'visited' | 'ranking'>>) => Promise<void>;
  deletePlace: (id: string) => Promise<boolean>;
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
      return true;
    }
    return false;
  },
}));
