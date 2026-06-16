'use client';

import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GooglePlaceResult, Category } from '../types';
import { buildPhotoUrl } from '../lib/photoUrl';
import { CATEGORIES } from '../constants/categories';

interface Props {
  result: GooglePlaceResult | null;
  category: Category;
  onSave: () => void;
  onDismiss: () => void;
  saving: boolean;
}

export function PlacePreviewSheet({ result, category, onSave, onDismiss, saving }: Props) {
  const snapPoints = useMemo(() => ['40%'], []);
  const catLabel = CATEGORIES.find((c) => c.value === category)?.label ?? category;
  const photoUrl = result?.photos?.[0]
    ? buildPhotoUrl(result.photos[0].name)
    : null;

  if (!result) return null;

  return (
    <BottomSheet snapPoints={snapPoints} onClose={onDismiss} enablePanDownToClose>
      <BottomSheetView style={styles.content}>
        {photoUrl && (
          <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
        )}
        <Text style={styles.name}>{result.displayName.text}</Text>
        <Text style={styles.address}>{result.formattedAddress}</Text>
        <Text style={styles.cat}>{catLabel}</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save to collection</Text>
          )}
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16 },
  photo: { width: '100%', height: 140, borderRadius: 8, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  address: { fontSize: 13, color: '#666', marginBottom: 4 },
  cat: { fontSize: 12, color: '#999', marginBottom: 16 },
  saveBtn: {
    backgroundColor: '#222',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
