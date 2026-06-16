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

    try {
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

      setSelected(null);
      router.back();
    } finally {
      setSaving(false);
    }
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
