import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/rider/HomeScreen';
import MapScreen from '../screens/rider/MapScreen';
import RideScreen from '../screens/rider/RideScreen';
import PaymentScreen from '../screens/rider/PaymentScreen';
import ProfileScreen from '../screens/rider/ProfileScreen';
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import DriverRideScreen from '../screens/driver/DriverRideScreen';
import DriverEarningsScreen from '../screens/driver/DriverEarningsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      {!user ? (
        // Auth flow
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : user.role === 'driver' ? (
        // Driver flow
        <>
          <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
          <Stack.Screen name="DriverRide" component={DriverRideScreen} />
          <Stack.Screen name="DriverEarnings" component={DriverEarningsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      ) : (
        // Rider flow
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="Ride" component={RideScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;