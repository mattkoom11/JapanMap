import React from 'react';
import { ScrollView, Image, StyleSheet, Dimensions } from 'react-native';
import { buildPhotoUrl } from '../lib/photoUrl';

const { width } = Dimensions.get('window');

interface Props {
  photoReferences: string[];
}

export function PhotoCarousel({ photoReferences }: Props) {
  return (
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
      {photoReferences.map((ref, i) => (
        <Image
          key={i}
          source={{ uri: buildPhotoUrl(ref) }}
          style={styles.photo}
          resizeMode="cover"
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  photo: { width, height: 260 },
});
