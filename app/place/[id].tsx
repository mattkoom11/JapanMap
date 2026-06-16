import React from 'react';
import {
  View, Text, TouchableOpacity, Alert, StyleSheet,
  ScrollView, Linking, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePlacesStore } from '../../store/usePlacesStore';
import { PhotoCarousel } from '../../components/PhotoCarousel';
import { VisitedToggle } from '../../components/VisitedToggle';
import { StarRanking } from '../../components/StarRanking';
import { CATEGORIES } from '../../constants/categories';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { places, updatePlace, deletePlace } = usePlacesStore();
  const place = places.find((p) => p.id === id);

  if (!place) return null;

  const catColor = CATEGORIES.find((c) => c.value === place.category)?.color ?? '#888';
  const catLabel = CATEGORIES.find((c) => c.value === place.category)?.label ?? place.category;

  const handleDelete = () => {
    Alert.alert('Remove place', `Remove "${place.name}" from your collection?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const ok = await deletePlace(place.id);
          if (ok) router.back();
        },
      },
    ]);
  };

  const handleVisitedToggle = (visited: boolean) => {
    updatePlace(place.id, { visited, ranking: visited ? place.ranking : null });
  };

  const handleRate = (stars: number) => {
    updatePlace(place.id, { ranking: stars });
  };

  const openMaps = () => {
    const url = `maps://?q=${encodeURIComponent(place.name)}&ll=${place.lat},${place.lng}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {place.photo_references.length > 0 && (
          <PhotoCarousel photoReferences={place.photo_references} />
        )}

        <View style={styles.body}>
          <View style={styles.row}>
            <Text style={styles.name}>{place.name}</Text>
            <TouchableOpacity onPress={handleDelete}>
              <Text style={styles.deleteBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.catBadge, { backgroundColor: catColor }]}>
            <Text style={styles.catLabel}>{catLabel}</Text>
          </View>

          <Text style={styles.location}>
            {[place.neighborhood, place.city, place.prefecture].filter(Boolean).join(', ')}
          </Text>

          <VisitedToggle visited={place.visited} onToggle={handleVisitedToggle} />

          <StarRanking
            ranking={place.ranking}
            disabled={!place.visited}
            onRate={handleRate}
          />

          <TouchableOpacity style={styles.mapsBtn} onPress={openMaps}>
            <Text style={styles.mapsBtnText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Map</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  body: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 22, fontWeight: '700', flex: 1, marginBottom: 8 },
  deleteBtn: { fontSize: 18, color: '#ccc', padding: 4 },
  catBadge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  catLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  location: { fontSize: 13, color: '#777', marginBottom: 4 },
  mapsBtn: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mapsBtnText: { fontSize: 14, color: '#333' },
  backBtn: { position: 'absolute', top: 52, left: 16, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  backText: { fontSize: 14, color: '#007AFF' },
});
