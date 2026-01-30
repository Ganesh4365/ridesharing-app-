import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  useTheme as usePaperTheme,
  ActivityIndicator,
} from 'react-native-paper';
import MapView, { Marker, Polyline } from 'react-native-maps';
// import MapViewDirections from 'react-native-maps-directions'; // Temporarily disabled
import { useTheme } from '../contexts/ThemeContext';
import { useSocket } from '../contexts/SocketContext';
import { GOOGLE_MAPS_API_KEY } from '../constants';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const RideScreen = ({ route, navigation }: any) => {
  const { pickup, dropoff, vehicleType, fare } = route.params;
  const [rideStatus, setRideStatus] = useState('searching');
  const [driver, setDriver] = useState<any>(null);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [polylineCoords, setPolylineCoords] = useState<any[]>([]);
  
  const theme = useTheme();
  const paperTheme = usePaperTheme();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (isConnected && socket) {
      // Request ride
      socket.requestRide({
        pickup,
        dropoff,
        vehicleType,
        fare,
      });

      // Listen for driver assignment
      socket.on('driver_assigned', (data: any) => {
        setDriver(data.driver);
        setRideStatus('driver_found');
        setEstimatedTime(data.estimatedTime || 5);
      });

      // Listen for ride status changes
      socket.on('ride_status_change', (data: any) => {
        setRideStatus(data.status);
      });

      // Listen for driver location updates
      socket.on('location_update', (data: any) => {
        if (driver && data.userId === driver.id) {
          setDriver(prev => ({
            ...prev,
            currentLocation: data.location,
          }));
        }
      });

      return () => {
        socket.off('driver_assigned');
        socket.off('ride_status_change');
        socket.off('location_update');
      };
    }
  }, [isConnected, socket, pickup, dropoff, vehicleType, fare, driver]);

  useEffect(() => {
    // Get directions from pickup to dropoff
    if (pickup && dropoff) {
      setPolylineCoords([
        { latitude: pickup.latitude, longitude: pickup.longitude },
        { latitude: dropoff.latitude, longitude: dropoff.longitude },
      ]);
    }
  }, [pickup, dropoff]);

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            if (socket) {
              // Emit cancel event
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const getStatusText = () => {
    switch (rideStatus) {
      case 'searching':
        return 'Finding your driver...';
      case 'driver_found':
        return `${driver?.name || 'Driver'} is on the way!`;
      case 'arrived':
        return 'Driver has arrived!';
      case 'in_progress':
        return 'Enjoy your ride!';
      case 'completed':
        return 'Ride completed!';
      default:
        return 'Searching for drivers...';
    }
  };

  const getStatusIcon = () => {
    switch (rideStatus) {
      case 'searching':
        return '🔍';
      case 'driver_found':
        return '🚗';
      case 'arrived':
        return '📍';
      case 'in_progress':
        return '🛣️';
      case 'completed':
        return '✅';
      default:
        return '⏳';
    }
  };

  const handlePayment = () => {
    navigation.navigate('Payment', {
      rideId: 'temp_ride_id',
      amount: fare,
      driverId: driver?.id,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.theme.colors.background }]}>
      {/* Map View */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: (pickup.latitude + dropoff.latitude) / 2,
          longitude: (pickup.longitude + dropoff.longitude) / 2,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
      >
        {/* Pickup Marker */}
        <Marker
          coordinate={pickup}
          title="Pickup Location"
          pinColor="#4CAF50"
        />
        
        {/* Dropoff Marker */}
        <Marker
          coordinate={dropoff}
          title="Dropoff Location"
          pinColor="#F44336"
        />
        
        {/* Driver Marker */}
        {driver?.currentLocation && (
          <Marker
            coordinate={driver.currentLocation}
            title={driver.name}
            description="Your driver"
          />
        )}
        
        {/* Route Polyline */}
        {polylineCoords.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="#2196F3"
            strokeWidth={4}
          />
        )}
        
        {/* Directions */}
        {pickup && dropoff && (
          // <MapViewDirections
          //   origin={pickup}
          //   destination={dropoff}
          //   apikey={GOOGLE_MAPS_API_KEY}
          //   strokeWidth={4}
          //   strokeColor="#2196F3"
          //   onReady={(result) => {
          //     setPolylineCoords(result.coordinates);
          //   }}
          // />
          null
        )}
      </MapView>

      {/* Status Card */}
      <View style={styles.statusContainer}>
        <Card style={[styles.statusCard, { backgroundColor: theme.theme.colors.surface }]}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusText, { color: theme.theme.colors.text }]}>
                {getStatusText()}
              </Text>
              {rideStatus === 'driver_found' && estimatedTime > 0 && (
                <Text style={[styles.etaText, { color: theme.theme.colors.textSecondary }]}>
                  ETA: {estimatedTime} mins
                </Text>
              )}
            </View>
          </View>
          
          {driver && (
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Text style={styles.avatarText}>
                  {driver.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.driverDetails}>
                <Text style={[styles.driverName, { color: theme.theme.colors.text }]}>
                  {driver.name}
                </Text>
                <Text style={[styles.vehicleInfo, { color: theme.theme.colors.textSecondary }]}>
                  {driver.vehicleType} • {driver.vehicleNumber}
                </Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.rating}>⭐ {driver.rating || '4.5'}</Text>
                </View>
              </View>
            </View>
          )}
          
          {rideStatus === 'searching' && (
            <ActivityIndicator size="large" color={theme.theme.colors.primary} />
          )}
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {rideStatus === 'completed' ? (
            <Button
              mode="contained"
              onPress={handlePayment}
              style={[styles.actionButton, { backgroundColor: theme.theme.colors.primary }]}
              contentStyle={styles.buttonContent}
            >
              Pay ₹{fare}
            </Button>
          ) : (
            <Button
              mode="outlined"
              onPress={handleCancelRide}
              style={styles.cancelButton}
              contentStyle={styles.buttonContent}
            >
              Cancel Ride
            </Button>
          )}
        </View>
      </View>
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
  statusContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  statusCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  etaText: {
    fontSize: 14,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 14,
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  buttonContent: {
    paddingVertical: 12,
  },
});

export default RideScreen;