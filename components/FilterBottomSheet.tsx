import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { CategoryToggles } from './CategoryToggles';
import { ScopeSelector } from './ScopeSelector';
import { ScopeValueSelector } from './ScopeValueSelector';
import { useFilterStore } from '../store/useFilterStore';
import { usePlacesStore } from '../store/usePlacesStore';

export function FilterBottomSheet() {
  const { categories, scope, scopeValue, toggleCategory, setScope, setScopeValue, clearAll, distinctNeighborhoods } = useFilterStore();
  const { places } = usePlacesStore();
  const snapPoints = useMemo(() => [60, '50%'], []);
  const neighborhoods = distinctNeighborhoods(places);

  const activeCount =
    categories.length + (scope !== 'all' && scopeValue ? 1 : 0);

  return (
    <BottomSheet snapPoints={snapPoints} index={0}>
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Filter</Text>
          {activeCount > 0 && (
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clear}>Clear all ({activeCount})</Text>
            </TouchableOpacity>
          )}
        </View>
        <CategoryToggles selected={categories} onToggle={toggleCategory} />
        <ScopeSelector scope={scope} onSelect={setScope} />
        <ScopeValueSelector
          scope={scope}
          scopeValue={scopeValue}
          neighborhoods={neighborhoods}
          onSelect={setScopeValue}
        />
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600' },
  clear: { fontSize: 13, color: '#888' },
});
