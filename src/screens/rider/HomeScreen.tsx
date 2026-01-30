import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Text, Button, FAB, Portal, Modal } from 'react-native-paper';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocation } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';
import { VEHICLE_TYPES } from '../../constants';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const HomeScreen = ({ navigation }: any) => {
  const [selectedVehicle, setSelectedVehicle] = useState('sedan');
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [pickupLocation, setPickupLocation] = useState<any>(null);
  const [dropoffLocation, setDropoffLocation] = useState<any>(null);
  
  const theme = useTheme();
  const { location, getCurrentLocation } = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!location) {
      getCurrentLocation();
    } else {
      setPickupLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  }, [location]);

  const calculateFare = (vehicleType: string) => {
    const vehicle = VEHICLE_TYPES.find(v => v.id === vehicleType);
    if (!vehicle) return 0;
    
    const baseFare = vehicle.baseFare;
    const distanceFare = 10; // Simplified calculation
    return baseFare + distanceFare;
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    const fare = calculateFare(vehicleId);
    setEstimatedFare(fare);
    setShowVehicleModal(false);
  };

  const handleBookRide = () => {
    if (!pickupLocation || !dropoffLocation) {
      Alert.alert('Location Required', 'Please select pickup and dropoff locations');
      return;
    }
    
    navigation.navigate('Ride', {
      pickup: pickupLocation,
      dropoff: dropoffLocation,
      vehicleType: selectedVehicle,
      fare: estimatedFare,
    });
  };

  const handlePickupSelect = () => {
    navigation.navigate('Map', {
      mode: 'pickup',
      onLocationSelect: (location: any) => setPickupLocation(location),
    });
  };

  const handleDropoffSelect = () => {
    navigation.navigate('Map', {
      mode: 'dropoff',
      onLocationSelect: (location: any) => setDropoffLocation(location),
    });
  };

  const selectedVehicleData = VEHICLE_TYPES.find(v => v.id === selectedVehicle);

  return (
    <View style={[styles.container, { backgroundColor: theme.theme.colors.background }]}>
      {/* Map View */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location?.latitude || 37.78825,
          longitude: location?.longitude || -122.4324,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation
        followsUserLocation
      >
        {pickupLocation && (
          <Marker
            coordinate={pickupLocation}
            title="Pickup"
            pinColor="#4CAF50"
          />
        )}
        {dropoffLocation && (
          <Marker
            coordinate={dropoffLocation}
            title="Dropoff"
            pinColor="#F44336"
          />
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.welcomeText, { color: theme.theme.colors.text }]}>
          Welcome back, {user?.name?.split(' ')[0]}!
        </Text>
        <Text style={[styles.subtitleText, { color: theme.theme.colors.textSecondary }]}>
          Where would you like to go today?
        </Text>
      </View>

      {/* Location Selection Card */}
      <View style={[styles.locationCard, { backgroundColor: theme.theme.colors.surface }]}>
        <TouchableOpacity
          style={styles.locationInput}
          onPress={handlePickupSelect}
        >
          <View style={styles.locationDot} />
          <Text style={[styles.locationText, { color: theme.theme.colors.text }]}>
            {pickupLocation ? 'Current Location' : 'Select Pickup Location'}
          </Text>
        </TouchableOpacity>
        
        <View style={[styles.divider, { backgroundColor: theme.theme.colors.border }]} />
        
        <TouchableOpacity
          style={styles.locationInput}
          onPress={handleDropoffSelect}
        >
          <View style={[styles.locationDot, { backgroundColor: theme.theme.colors.primary }]} />
          <Text style={[styles.locationText, { color: theme.theme.colors.text }]}>
            {dropoffLocation ? 'Dropoff Location' : 'Where to?'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Vehicle Selection */}
      <TouchableOpacity
        style={[styles.vehicleSelector, { backgroundColor: theme.theme.colors.surface }]}
        onPress={() => setShowVehicleModal(true)}
      >
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleEmoji}>{selectedVehicleData?.icon}</Text>
          <View>
            <Text style={[styles.vehicleName, { color: theme.theme.colors.text }]}>
              {selectedVehicleData?.name}
            </Text>
            <Text style={[styles.vehicleDetails, { color: theme.theme.colors.textSecondary }]}>
              {estimatedFare > 0 ? `₹${estimatedFare}` : 'Select destination'}
            </Text>
          </View>
        </View>
        <Text style={[styles.chevron, { color: theme.theme.colors.textSecondary }]}>›</Text>
      </TouchableOpacity>

      {/* Book Ride Button */}
      {pickupLocation && dropoffLocation && (
        <FAB
          icon="car"
          label="Book Ride"
          style={[styles.fab, { backgroundColor: theme.theme.colors.primary }]}
          onPress={handleBookRide}
        />
      )}

      {/* Vehicle Selection Modal */}
      <Portal>
        <Modal
          visible={showVehicleModal}
          onDismiss={() => setShowVehicleModal(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.theme.colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: theme.theme.colors.text }]}>
            Select Vehicle Type
          </Text>
          
          {VEHICLE_TYPES.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleOption,
                { 
                  backgroundColor: selectedVehicle === vehicle.id ? theme.theme.colors.primary + '20' : 'transparent',
                  borderColor: theme.theme.colors.border,
                }
              ]}
              onPress={() => handleVehicleSelect(vehicle.id)}
            >
              <View style={styles.vehicleOptionInfo}>
                <Text style={styles.vehicleEmoji}>{vehicle.icon}</Text>
                <View>
                  <Text style={[styles.vehicleOptionName, { color: theme.theme.colors.text }]}>
                    {vehicle.name}
                  </Text>
                  <Text style={[styles.vehicleOptionDetails, { color: theme.theme.colors.textSecondary }]}>
                    {vehicle.capacity} seats • ₹{vehicle.baseFare} base fare
                  </Text>
                </View>
              </View>
              {selectedVehicle === vehicle.id && (
                <Text style={[styles.checkmark, { color: theme.theme.colors.primary }]}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    zIndex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
  },
  locationCard: {
    position: 'absolute',
    top: 140,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  locationText: {
    fontSize: 16,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 8,
  },
  vehicleSelector: {
    position: 'absolute',
    top: 260,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
  },
  vehicleDetails: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 100,
  },
  modalContainer: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  vehicleOptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleOptionName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  vehicleOptionDetails: {
    fontSize: 14,
    marginLeft: 12,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;