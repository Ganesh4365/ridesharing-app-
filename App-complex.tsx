import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { LocationProvider } from './src/contexts/LocationContext';
import { SocketProvider } from './src/contexts/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';
import theme from './src/constants/theme';

const Stack = createStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <LocationProvider>
            <SocketProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                <AppNavigator />
              </NavigationContainer>
            </SocketProvider>
          </LocationProvider>
        </AuthProvider>
      </PaperProvider>
    </ThemeProvider>
  );
}