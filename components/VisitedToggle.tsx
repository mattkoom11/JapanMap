import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  visited: boolean;
  onToggle: (visited: boolean) => void;
}

export function VisitedToggle({ visited, onToggle }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.option, visited && styles.activeOption]}
        onPress={() => onToggle(true)}
      >
        <Text style={[styles.label, visited && styles.activeLabel]}>Visited</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.option, !visited && styles.activeOption]}
        onPress={() => onToggle(false)}
      >
        <Text style={[styles.label, !visited && styles.activeLabel]}>Want to Visit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  option: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  activeOption: { backgroundColor: '#222', borderColor: '#222' },
  label: { fontSize: 14, color: '#555' },
  activeLabel: { color: '#fff', fontWeight: '600' },
});
