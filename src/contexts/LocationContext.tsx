import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import { Location as LocationType } from '../types';

interface LocationContextType {
  location: LocationType | null;
  isLoading: boolean;
  error: string | null;
  requestLocationPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationType | null>;
  watchLocation: (callback: (location: LocationType) => void) => void;
  stopWatching: () => void;
}

export const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchSubscription, setWatchSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    return () => {
      if (watchSubscription) {
        watchSubscription.remove();
      }
    };
  }, [watchSubscription]);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return false;
      }
      return true;
    } catch (err) {
      setError('Failed to request location permission');
      return false;
    }
  };

  const getCurrentLocation = async (): Promise<LocationType | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        return null;
      }

      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation: LocationType = {
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      };

      setLocation(newLocation);
      return newLocation;
    } catch (err) {
      setError('Failed to get current location');
      console.error('Location error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const watchLocation = (callback: (location: LocationType) => void) => {
    if (watchSubscription) {
      watchSubscription.remove();
    }

    const subscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 10,
      },
      (locationData) => {
        const newLocation: LocationType = {
          latitude: locationData.coords.latitude,
          longitude: locationData.coords.longitude,
        };
        setLocation(newLocation);
        callback(newLocation);
      }
    );

    setWatchSubscription(subscription);
  };

  const stopWatching = () => {
    if (watchSubscription) {
      watchSubscription.remove();
      setWatchSubscription(null);
    }
  };

  return (
    <LocationContext.Provider value={{
      location,
      isLoading,
      error,
      requestLocationPermission,
      getCurrentLocation,
      watchLocation,
      stopWatching,
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = React.useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};