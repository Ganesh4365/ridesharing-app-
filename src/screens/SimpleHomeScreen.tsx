import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('sedan');
  const [estimatedFare, setEstimatedFare] = useState(0);

  const vehicleTypes = [
    { id: 'bike', name: 'Bike', icon: '🏍️', baseFare: 15 },
    { id: 'auto', name: 'Auto', icon: '🚗', baseFare: 25 },
    { id: 'sedan', name: 'Sedan', icon: '🚙', baseFare: 40 },
    { id: 'suv', name: 'SUV', icon: '🚐', baseFare: 60 },
    { id: 'premium', name: 'Premium', icon: '🚘', baseFare: 80 },
  ];

  const calculateFare = (vehicleType: string) => {
    const vehicle = vehicleTypes.find(v => v.id === vehicleType);
    if (!vehicle) return 0;
    
    const baseFare = vehicle.baseFare;
    const distanceFare = 10; // Simplified calculation
    return baseFare + distanceFare;
  };

  const handleBookRide = () => {
    const fare = calculateFare(selectedVehicle);
    setEstimatedFare(fare);
    
    Alert.alert(
      'SwiftRide',
      `Your ${selectedVehicle} ride is booked! Fare: ₹${fare}`,
      [
        { text: 'OK', onPress: () => console.log('Ride booked!') }
      ]
    );
  };

  const handleNavigation = (screen: string) => {
    Alert.alert('Navigation', `Navigating to ${screen}...`);
    // navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to SwiftRide! 🚗</Text>
        <Text style={styles.subtitleText}>Your journey, our priority</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>🗺</Text>
          <Text style={styles.mapLabel}>Interactive Map</Text>
          <Text style={styles.mapNote}>
            Real-time GPS tracking & live driver positions
          </Text>
        </View>

        {/* Vehicle Selection */}
        <View style={styles.vehicleSection}>
          <Text style={styles.sectionTitle}>Select Vehicle Type</Text>
          
          {vehicleTypes.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleOption,
                selectedVehicle === vehicle.id && styles.selectedVehicle
              ]}
              onPress={() => {
                setSelectedVehicle(vehicle.id);
                setEstimatedFare(calculateFare(vehicle.id));
              }}
            >
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                <View>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  <Text style={styles.vehiclePrice}>₹{vehicle.baseFare} base fare</Text>
                </View>
              </View>
              <Text style={styles.fareDisplay}>
                ₹{calculateFare(vehicle.id)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleNavigation('RideHistory')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>Ride History</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleNavigation('Payment')}
          >
            <Text style={styles.actionIcon}>💳</Text>
            <Text style={styles.actionText}>Payment Methods</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleNavigation('Emergency')}
          >
            <Text style={styles.actionIcon}>🆘️</Text>
            <Text style={styles.actionText}>Emergency SOS</Text>
          </TouchableOpacity>
        </View>

        {/* Book Ride Button */}
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={handleBookRide}
        >
          <Text style={styles.bookButtonText}>
            🚗 Book {selectedVehicle.charAt(0).toUpperCase() + selectedVehicle.slice(1)} Ride
          </Text>
          <Text style={styles.fareDisplay}>₹{estimatedFare}</Text>
        </TouchableOpacity>

        {/* Feature Highlights */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>SwiftRide Features</Text>
          
          <View style={styles.featureGrid}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📍</Text>
              <Text style={styles.featureTitle}>Real-time GPS</Text>
              <Text style={styles.featureDesc}>2-second location updates</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureTitle}>Smart Matching</Text>
              <Text style={styles.featureDesc}>AI-powered driver assignment</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💬</Text>
              <Text style={styles.featureTitle}>In-app Chat</Text>
              <Text style={styles.featureDesc}>Real-time communication</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⭐</Text>
              <Text style={styles.featureTitle}>Driver Favorites</Text>
              <Text style={styles.featureDesc}>Book preferred drivers</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🛡️</Text>
              <Text style={styles.featureTitle}>Safety Features</Text>
              <Text style={styles.featureDesc}>SOS & ride sharing</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🌙</Text>
              <Text style={styles.featureTitle}>Dark Mode</Text>
              <Text style={styles.featureDesc}>Comfortable night interface</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📍</Text>
          <Text style={styles.navLabel}>Trips</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FF6B6B',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 16,
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mapPlaceholder: {
    backgroundColor: 'white',
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapText: {
    fontSize: 48,
    marginBottom: 8,
  },
  mapLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  mapNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  vehicleSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedVehicle: {
    backgroundColor: '#FF6B6B20',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '500',
  },
  vehiclePrice: {
    fontSize: 12,
    color: '#666',
  },
  fareDisplay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  actionSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  featuresSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
  },
});

export default HomeScreen;