import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Scope } from '../types';

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'all',          label: 'All Japan' },
  { value: 'region',       label: 'Region' },
  { value: 'prefecture',   label: 'Prefecture' },
  { value: 'city',         label: 'City' },
  { value: 'neighborhood', label: 'Neighborhood' },
];

interface Props {
  scope: Scope;
  onSelect: (scope: Scope) => void;
}

export function ScopeSelector({ scope, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {SCOPES.map((s) => (
        <TouchableOpacity
          key={s.value}
          onPress={() => onSelect(s.value)}
          style={[styles.tab, scope === s.value && styles.activeTab]}
        >
          <Text style={[styles.label, scope === s.value && styles.activeLabel]}>
            {s.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  activeTab: { backgroundColor: '#222' },
  label: { fontSize: 12, color: '#444' },
  activeLabel: { color: '#fff', fontWeight: '600' },
});
