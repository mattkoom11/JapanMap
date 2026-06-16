import React, { forwardRef } from 'react';
import MapView, { MapViewProps, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { CategoryPin } from './CategoryPin';
import { Place } from '../types';

const JAPAN_REGION = {
  latitude: 37.0,
  longitude: 137.0,
  latitudeDelta: 15.0,
  longitudeDelta: 15.0,
};

interface Props extends Partial<MapViewProps> {
  places: Place[];
  onPinPress: (place: Place) => void;
}

export const JapanMapView = forwardRef<MapView, Props>(
  ({ places, onPinPress, ...rest }, ref) => {
    return (
      <MapView
        ref={ref}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={JAPAN_REGION}
        {...rest}
      >
        {places.map((place) => (
          <CategoryPin
            key={place.id}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            category={place.category}
            onPress={() => onPinPress(place)}
          />
        ))}
      </MapView>
    );
  }
);

const styles = StyleSheet.create({
  map: { flex: 1 },
});
