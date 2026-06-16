import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Category } from '../types';
import { CATEGORIES, CATEGORY_COLOR } from '../constants/categories';

interface Props {
  selected: Category[];
  onToggle: (category: Category) => void;
}

export function CategoryToggles({ selected, onToggle }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
      {CATEGORIES.map((cat) => {
        const active = selected.includes(cat.value);
        return (
          <TouchableOpacity
            key={cat.value}
            onPress={() => onToggle(cat.value)}
            style={[
              styles.pill,
              active && { backgroundColor: CATEGORY_COLOR[cat.value] },
            ]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 12 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  label: { fontSize: 13, color: '#444' },
  activeLabel: { color: '#fff', fontWeight: '600' },
});
