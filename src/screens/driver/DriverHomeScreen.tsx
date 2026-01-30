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
  FAB,
  Switch,
  useTheme as usePaperTheme,
  ActivityIndicator,
} from 'react-native-paper';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocket } from '../../contexts/SocketContext';
import { useLocation } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const DriverHomeScreen = ({ route, navigation }: any) => {
  const [isOnline, setIsOnline] = useState(false);
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [earnings, setEarnings] = useState(0);
  const [totalRides, setTotalRides] = useState(0);
  
  const theme = useTheme();
  const paperTheme = usePaperTheme();
  const { socket, isConnected } = useSocket();
  const { location } = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (isConnected && socket) {
      // Listen for ride requests
      socket.on('new_ride_request', (request: any) => {
        setIncomingRequest(request);
      });

      // Listen for ride status changes
      socket.on('ride_status_change', (data: any) => {
        if (currentRide && currentRide.id === data.rideId) {
          setCurrentRide(prev => ({ ...prev, status: data.status }));
          
          if (data.status === 'completed') {
            setEarnings(prev => prev + currentRide.fare);
            setTotalRides(prev => prev + 1);
            setCurrentRide(null);
          }
        }
      });

      return () => {
        socket.off('new_ride_request');
        socket.off('ride_status_change');
      };
    }
  }, [isConnected, socket, currentRide]);

  useEffect(() => {
    if (location && socket) {
      // Send location updates every 5 seconds when online
      const interval = setInterval(() => {
        if (isOnline) {
          socket.updateLocation(location);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [location, socket, isOnline]);

  const handleStatusToggle = () => {
    const newStatus = !isOnline;
    
    if (newStatus) {
      Alert.alert(
        'Go Online',
        'Are you ready to receive ride requests?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go Online',
            onPress: () => {
              setIsOnline(true);
              if (socket) {
                socket.emit('driver_status_change', {
                  isOnline: true,
                  location,
                });
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Go Offline',
        'You will not receive ride requests while offline.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go Offline',
            onPress: () => {
              setIsOnline(false);
              if (socket) {
                socket.emit('driver_status_change', {
                  isOnline: false,
                });
              }
            },
          },
        ]
      );
    }
  };

  const handleAcceptRide = () => {
    if (incomingRequest && socket) {
      socket.acceptRide(incomingRequest.rideId);
      setCurrentRide(incomingRequest);
      setIncomingRequest(null);
      
      navigation.navigate('DriverRide', { ride: incomingRequest });
    }
  };

  const handleRejectRide = () => {
    setIncomingRequest(null);
  };

  const handleNavigateToEarnings = () => {
    navigation.navigate('DriverEarnings');
  };

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
        {/* Driver Location Marker */}
        {location && (
          <Marker
            coordinate={location}
            title="Your Location"
            description={isOnline ? 'Online' : 'Offline'}
            pinColor={isOnline ? '#4CAF50' : '#F44336'}
          />
        )}
      </MapView>

      {/* Status Toggle */}
      <View style={styles.statusContainer}>
        <Card style={[styles.statusCard, { backgroundColor: theme.theme.colors.surface }]}>
          <View style={styles.statusHeader}>
            <Text style={[styles.statusText, { color: theme.theme.colors.text }]}>
              Driver Status
            </Text>
            <Switch
              value={isOnline}
              onValueChange={handleStatusToggle}
              color={theme.theme.colors.primary}
            />
          </View>
          <Text style={[
            styles.statusValue,
            { color: isOnline ? '#4CAF50' : '#F44336' }
          ]}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </Text>
        </Card>
      </View>

      {/* Earnings Card */}
      <View style={styles.earningsContainer}>
        <Card style={[styles.earningsCard, { backgroundColor: theme.theme.colors.surface }]}>
          <View style={styles.earningsHeader}>
            <Text style={[styles.earningsTitle, { color: theme.theme.colors.text }]}>
              Today's Earnings
            </Text>
            <Button
              mode="text"
              onPress={handleNavigateToEarnings}
              textColor={theme.theme.colors.primary}
            >
              View All
            </Button>
          </View>
          <Text style={[styles.earningsAmount, { color: theme.theme.colors.primary }]}>
            ₹{earnings}
          </Text>
          <Text style={[styles.earningsRides, { color: theme.theme.colors.textSecondary }]}>
            {totalRides} rides completed
          </Text>
        </Card>
      </View>

      {/* Incoming Ride Request Modal */}
      {incomingRequest && (
        <View style={styles.requestModal}>
          <Card style={[styles.requestCard, { backgroundColor: theme.theme.colors.surface }]}>
            <View style={styles.requestHeader}>
              <Text style={[styles.requestTitle, { color: theme.theme.colors.text }]}>
                New Ride Request
              </Text>
              <ActivityIndicator size="small" color={theme.theme.colors.primary} />
            </View>
            
            <View style={styles.requestDetails}>
              <Text style={[styles.requestLabel, { color: theme.theme.colors.textSecondary }]}>
                Pickup: {incomingRequest.pickup.address || 'Location A'}
              </Text>
              <Text style={[styles.requestLabel, { color: theme.theme.colors.textSecondary }]}>
                Dropoff: {incomingRequest.dropoff.address || 'Location B'}
              </Text>
              <Text style={[styles.requestFare, { color: theme.theme.colors.primary }]}>
                ₹{incomingRequest.fare}
              </Text>
            </View>
            
            <View style={styles.requestActions}>
              <Button
                mode="outlined"
                onPress={handleRejectRide}
                style={[styles.rejectButton, styles.requestButton]}
              >
                Reject
              </Button>
              <Button
                mode="contained"
                onPress={handleAcceptRide}
                style={[styles.acceptButton, styles.requestButton]}
              >
                Accept
              </Button>
            </View>
          </Card>
        </View>
      )}

      {/* Current Ride Info */}
      {currentRide && (
        <View style={styles.currentRideContainer}>
          <Card style={[styles.currentRideCard, { backgroundColor: theme.theme.colors.surface }]}>
            <Text style={[styles.currentRideTitle, { color: theme.theme.colors.text }]}>
              Current Ride
            </Text>
            <Text style={[styles.currentRideStatus, { color: theme.theme.colors.textSecondary }]}>
              Status: {currentRide.status}
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('DriverRide', { ride: currentRide })}
              style={[styles.viewRideButton, { backgroundColor: theme.theme.colors.primary }]}
            >
              View Ride Details
            </Button>
          </Card>
        </View>
      )}

      {/* FAB for Quick Actions */}
      {isOnline && !currentRide && (
        <FAB
          icon="help"
          label="Need Help?"
          style={styles.helpFab}
          onPress={() => Alert.alert('Help', 'Support team will contact you soon.')}
        />
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
  statusContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  earningsContainer: {
    position: 'absolute',
    top: 140,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  earningsCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  earningsRides: {
    fontSize: 14,
  },
  requestModal: {
    position: 'absolute',
    top: '30%',
    left: 16,
    right: 16,
    zIndex: 2,
  },
  requestCard: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  requestDetails: {
    marginBottom: 20,
  },
  requestLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  requestFare: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requestButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  rejectButton: {
    borderColor: '#F44336',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  currentRideContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  currentRideCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentRideTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  currentRideStatus: {
    fontSize: 14,
    marginBottom: 12,
  },
  viewRideButton: {
    paddingVertical: 8,
  },
  helpFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 20,
    backgroundColor: '#FF9800',
  },
});

export default DriverHomeScreen;