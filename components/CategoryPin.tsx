import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Category } from '../types';
import { CATEGORY_COLOR } from '../constants/categories';

interface Props {
  coordinate: { latitude: number; longitude: number };
  category: Category;
  onPress: () => void;
}

export function CategoryPin({ coordinate, category, onPress }: Props) {
  return (
    <Marker coordinate={coordinate} onPress={onPress}>
      <View style={[styles.pin, { backgroundColor: CATEGORY_COLOR[category] }]} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
