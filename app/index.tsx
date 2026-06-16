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
