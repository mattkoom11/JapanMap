import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Scope } from '../types';
import { REGIONS } from '../constants/regions';
import { MAIN_CITIES } from '../constants/cities';

const PREFECTURES = [
  'Hokkaido','Aomori','Iwate','Miyagi','Akita','Yamagata','Fukushima',
  'Ibaraki','Tochigi','Gunma','Saitama','Chiba','Tokyo','Kanagawa',
  'Niigata','Toyama','Ishikawa','Fukui','Yamanashi','Nagano','Gifu',
  'Shizuoka','Aichi','Mie','Shiga','Kyoto','Osaka','Hyogo','Nara',
  'Wakayama','Tottori','Shimane','Okayama','Hiroshima','Yamaguchi',
  'Tokushima','Kagawa','Ehime','Kochi','Fukuoka','Saga','Nagasaki',
  'Kumamoto','Oita','Miyazaki','Kagoshima','Okinawa',
];

interface Props {
  scope: Scope;
  scopeValue: string | null;
  neighborhoods: string[];
  onSelect: (value: string) => void;
}

export function ScopeValueSelector({ scope, scopeValue, neighborhoods, onSelect }: Props) {
  if (scope === 'all') return null;

  const items: { value: string; label: string }[] =
    scope === 'region'
      ? REGIONS.map((r) => ({ value: r.value, label: r.label }))
      : scope === 'prefecture'
      ? PREFECTURES.map((p) => ({ value: p, label: p }))
      : scope === 'city'
      ? MAIN_CITIES.map((c) => ({ value: c.value, label: c.label }))
      : neighborhoods.map((n) => ({ value: n, label: n }));

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.value}
          onPress={() => onSelect(item.value)}
          style={[styles.item, scopeValue === item.value && styles.activeItem]}
        >
          <Text style={[styles.label, scopeValue === item.value && styles.activeLabel]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 200 },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  activeItem: { backgroundColor: '#f5f5f5' },
  label: { fontSize: 14, color: '#333' },
  activeLabel: { fontWeight: '600', color: '#111' },
});
