import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  useTheme as usePaperTheme,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import MapView, { Marker, Polyline } from 'react-native-maps';
// import MapViewDirections from 'react-native-maps-directions'; // Temporarily disabled
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import { GOOGLE_MAPS_API_KEY } from '../../constants';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const DriverRideScreen = ({ route, navigation }: any) => {
  const { ride } = route.params;
  const [rideStatus, setRideStatus] = useState(ride.status || 'accepted');
  const [polylineCoords, setPolylineCoords] = useState<any[]>([]);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  
  const theme = useTheme();
  const paperTheme = usePaperTheme();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (isConnected && socket) {
      // Listen for ride status changes
      socket.on('ride_status_change', (data: any) => {
        if (data.rideId === ride.id) {
          setRideStatus(data.status);
        }
      });

      return () => {
        socket.off('ride_status_change');
      };
    }
  }, [isConnected, socket, ride.id]);

  useEffect(() => {
    // Calculate route from pickup to dropoff
    if (ride.pickup && ride.dropoff) {
      const coords = [
        ride.pickup,
        ride.dropoff,
      ];
      setPolylineCoords(coords);
    }
  }, [ride]);

  const handleStatusChange = (newStatus: string) => {
    if (socket) {
      socket.emit('update_ride_status', {
        rideId: ride.id,
        status: newStatus,
      });
      setRideStatus(newStatus);
    }
  };

  const handleArrived = () => {
    Alert.alert(
      'Confirm Arrival',
      'Have you arrived at the pickup location?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => handleStatusChange('arrived'),
        },
      ]
    );
  };

  const handleStartRide = () => {
    Alert.alert(
      'Start Ride',
      'Start the ride to dropoff location?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Start Ride',
          onPress: () => handleStatusChange('in_progress'),
        },
      ]
    );
  };

  const handleCompleteRide = () => {
    Alert.alert(
      'Complete Ride',
      'Has the ride been completed successfully?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => handleStatusChange('completed'),
        },
      ]
    );
  };

  const handleNavigateToMaps = () => {
    // Open in Google Maps or Apple Maps
    const { pickup, dropoff } = ride;
    const url = `https://www.google.com/maps/dir/${pickup.latitude},${pickup.longitude}/${dropoff.latitude},${dropoff.longitude}`;
    
    Alert.alert(
      'Open Maps',
      'Open navigation in Google Maps?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open',
          onPress: () => {
            // In a real app, use Linking.openURL(url)
            Alert.alert('Opening Maps', 'Navigation would open in Google Maps');
          },
        },
      ]
    );
  };

  const getStatusText = () => {
    switch (rideStatus) {
      case 'accepted':
        return 'Navigate to pickup location';
      case 'arrived':
        return 'Waiting for rider';
      case 'in_progress':
        return 'En route to destination';
      case 'completed':
        return 'Ride completed';
      default:
        return 'Preparing for ride';
    }
  };

  const getStatusColor = () => {
    switch (rideStatus) {
      case 'accepted':
        return '#2196F3';
      case 'arrived':
        return '#FF9800';
      case 'in_progress':
        return '#4CAF50';
      case 'completed':
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  const renderActionButtons = () => {
    switch (rideStatus) {
      case 'accepted':
        return (
          <Button
            mode="contained"
            onPress={handleArrived}
            style={[styles.actionButton, { backgroundColor: theme.theme.colors.primary }]}
          >
            I've Arrived
          </Button>
        );
      case 'arrived':
        return (
          <Button
            mode="contained"
            onPress={handleStartRide}
            style={[styles.actionButton, { backgroundColor: theme.theme.colors.primary }]}
          >
            Start Ride
          </Button>
        );
      case 'in_progress':
        return (
          <Button
            mode="contained"
            onPress={handleCompleteRide}
            style={[styles.actionButton, { backgroundColor: theme.theme.colors.primary }]}
          >
            Complete Ride
          </Button>
        );
      case 'completed':
        return (
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
          >
            Back to Home
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.theme.colors.background }]}>
      {/* Map View */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: (ride.pickup.latitude + ride.dropoff.latitude) / 2,
          longitude: (ride.pickup.longitude + ride.dropoff.longitude) / 2,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
      >
        {/* Pickup Marker */}
        <Marker
          coordinate={ride.pickup}
          title="Pickup Location"
          description="Rider is waiting here"
          pinColor="#4CAF50"
        />
        
        {/* Dropoff Marker */}
        <Marker
          coordinate={ride.dropoff}
          title="Dropoff Location"
          description="Destination"
          pinColor="#F44336"
        />
        
        {/* Route Polyline */}
        {polylineCoords.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="#2196F3"
            strokeWidth={4}
          />
        )}
        
        {/* Directions */}
        {ride.pickup && ride.dropoff && (
          // <MapViewDirections
          //   origin={ride.pickup}
          //   destination={ride.dropoff}
          //   apikey={GOOGLE_MAPS_API_KEY}
          //   strokeWidth={4}
          //   strokeColor="#2196F3"
          //   onReady={(result) => {
          //     setPolylineCoords(result.coordinates);
          //     setDistance(result.distance);
          //     setEstimatedTime(result.duration);
          //   }}
          // />
          null
        )}
      </MapView>

      {/* Navigation Button */}
      <TouchableOpacity
        style={[styles.navigateButton, { backgroundColor: theme.theme.colors.surface }]}
        onPress={handleNavigateToMaps}
      >
        <IconButton
          icon="navigation"
          iconColor={theme.theme.colors.primary}
          size={24}
        />
        <Text style={[styles.navigateText, { color: theme.theme.colors.primary }]}>
          Navigate
        </Text>
      </TouchableOpacity>

      {/* Ride Info Card */}
      <View style={styles.rideInfoContainer}>
        <Card style={[styles.rideInfoCard, { backgroundColor: theme.theme.colors.surface }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusText, { color: theme.theme.colors.text }]}>
                {getStatusText()}
              </Text>
              {estimatedTime > 0 && (
                <Text style={[styles.estimatedTime, { color: theme.theme.colors.textSecondary }]}>
                  {Math.round(estimatedTime)} mins • {Math.round(distance / 1000)} km
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.rideDetails}>
            <View style={styles.locationRow}>
              <Text style={[styles.locationLabel, { color: theme.theme.colors.textSecondary }]}>
                Pickup
              </Text>
              <Text style={[styles.locationValue, { color: theme.theme.colors.text }]}>
                {ride.pickup.address || `${ride.pickup.latitude.toFixed(4)}, ${ride.pickup.longitude.toFixed(4)}`}
              </Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.theme.colors.border }]} />
            
            <View style={styles.locationRow}>
              <Text style={[styles.locationLabel, { color: theme.theme.colors.textSecondary }]}>
                Dropoff
              </Text>
              <Text style={[styles.locationValue, { color: theme.theme.colors.text }]}>
                {ride.dropoff.address || `${ride.dropoff.latitude.toFixed(4)}, ${ride.dropoff.longitude.toFixed(4)}`}
              </Text>
            </View>
          </View>
          
          <View style={[styles.fareContainer, { backgroundColor: theme.theme.colors.primary + '20' }]}>
            <Text style={[styles.fareLabel, { color: theme.theme.colors.textSecondary }]}>
              Fare
            </Text>
            <Text style={[styles.fareAmount, { color: theme.theme.colors.primary }]}>
              ₹{ride.fare}
            </Text>
          </View>
          
          {/* Action Button */}
          {renderActionButtons()}
        </Card>
      </View>

      {/* Rider Info */}
      {(rideStatus === 'arrived' || rideStatus === 'in_progress') && (
        <View style={styles.riderInfo}>
          <Card style={[styles.riderCard, { backgroundColor: theme.theme.colors.surface }]}>
            <View style={styles.riderDetails}>
              <View style={[styles.riderAvatar, { backgroundColor: theme.theme.colors.primary }]}>
                <Text style={styles.riderAvatarText}>
                  {ride.riderName?.charAt(0).toUpperCase() || 'R'}
                </Text>
              </View>
              <View style={styles.riderInfoContainer}>
                <Text style={[styles.riderName, { color: theme.theme.colors.text }]}>
                  {ride.riderName || 'Rider'}
                </Text>
                <Text style={[styles.rideType, { color: theme.theme.colors.textSecondary }]}>
                  {ride.vehicleType?.toUpperCase()} • {estimatedTime} mins
                </Text>
              </View>
            </View>
            <IconButton
              icon="phone"
              iconColor={theme.theme.colors.primary}
              onPress={() => Alert.alert('Call', 'Calling rider...')}
            />
          </Card>
        </View>
      )}
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
  navigateButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    alignItems: 'center',
    padding: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navigateText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  rideInfoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  rideInfoCard: {
    padding: 20,
    borderRadius: 12,
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
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  estimatedTime: {
    fontSize: 14,
  },
  rideDetails: {
    marginBottom: 16,
  },
  locationRow: {
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  fareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  fareLabel: {
    fontSize: 16,
  },
  fareAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionButton: {
    paddingVertical: 4,
  },
  riderInfo: {
    position: 'absolute',
    bottom: 200,
    left: 16,
    right: 16,
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  riderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riderAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  riderInfoContainer: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  rideType: {
    fontSize: 14,
  },
});

export default DriverRideScreen;