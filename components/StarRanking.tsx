import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  ranking: number | null;
  disabled: boolean;
  onRate: (stars: number) => void;
}

export function StarRanking({ ranking, disabled, onRate }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => !disabled && onRate(star)}
          disabled={disabled}
        >
          <Text style={[styles.star, ranking != null && star <= ranking && styles.filled]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
      {disabled && <Text style={styles.hint}> (visit first)</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  star: { fontSize: 28, color: '#ddd' },
  filled: { color: '#F4C430' },
  hint: { fontSize: 12, color: '#aaa', marginLeft: 4 },
});
