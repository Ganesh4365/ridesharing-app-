import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  FAB,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation } from '../contexts/LocationContext';
import { GOOGLE_MAPS_API_KEY } from '../constants';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const MapScreen = ({ route, navigation }: any) => {
  const { mode, onLocationSelect } = route.params;
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const mapRef = useRef<MapView>(null);
  
  const theme = useTheme();
  const paperTheme = usePaperTheme();
  const { location } = useLocation();

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
    
    // Center map on selected location
    mapRef.current?.animateToRegion({
      ...coordinate,
      latitudeDelta: LATITUDE_DELTA / 2,
      longitudeDelta: LONGITUDE_DELTA / 2,
    }, 500);
  };

  const handleConfirmLocation = () => {
    if (!selectedLocation) {
      Alert.alert('Location Required', 'Please select a location on the map');
      return;
    }
    
    if (onLocationSelect) {
      onLocationSelect(selectedLocation);
    }
    navigation.goBack();
  };

  const handleCurrentLocation = () => {
    if (location) {
      setSelectedLocation(location);
      mapRef.current?.animateToRegion({
        ...location,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 1000);
    } else {
      Alert.alert('Location Error', 'Unable to get current location');
    }
  };

  const getTitle = () => {
    return mode === 'pickup' ? 'Select Pickup Location' : 'Select Dropoff Location';
  };

  const getMarkerColor = () => {
    return mode === 'pickup' ? '#4CAF50' : '#F44336';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backText, { color: theme.theme.colors.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.theme.colors.text }]}>
          {getTitle()}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location?.latitude || 37.78825,
          longitude: location?.longitude || -122.4324,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        onPress={handleMapPress}
        showsUserLocation
        followsUserLocation
      >
        {/* Selected Location Marker */}
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title={mode === 'pickup' ? 'Pickup Location' : 'Dropoff Location'}
            pinColor={getMarkerColor()}
          />
        )}
        
        {/* Current Location Marker */}
        {location && mode === 'pickup' && !selectedLocation && (
          <Marker
            coordinate={location}
            title="Your Current Location"
            pinColor="#2196F3"
          />
        )}
      </MapView>

      {/* Current Location Button */}
      <TouchableOpacity
        style={[styles.locationButton, { backgroundColor: theme.theme.colors.surface }]}
        onPress={handleCurrentLocation}
      >
        <Text style={[styles.locationButtonText, { color: theme.theme.colors.primary }]}>
          📍
        </Text>
      </TouchableOpacity>

      {/* Selected Location Info */}
      {selectedLocation && (
        <View style={[styles.locationInfo, { backgroundColor: theme.theme.colors.surface }]}>
          <Text style={[styles.locationTitle, { color: theme.theme.colors.text }]}>
            Selected Location
          </Text>
          <Text style={[styles.locationCoords, { color: theme.theme.colors.textSecondary }]}>
            {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {/* Confirm Button */}
      {selectedLocation && (
        <FAB
          icon="check"
          label="Confirm Location"
          style={[styles.fab, { backgroundColor: theme.theme.colors.primary }]}
          onPress={handleConfirmLocation}
        />
      )}

      {/* Instructions */}
      {!selectedLocation && (
        <View style={[styles.instructions, { backgroundColor: theme.theme.colors.surface }]}>
          <Text style={[styles.instructionText, { color: theme.theme.colors.text }]}>
            Tap anywhere on the map to select {mode === 'pickup' ? 'pickup' : 'dropoff'} location
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    width: 60,
  },
  map: {
    flex: 1,
  },
  locationButton: {
    position: 'absolute',
    top: 120,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationButtonText: {
    fontSize: 24,
  },
  locationInfo: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 20,
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default MapScreen;