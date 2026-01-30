import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    tertiary: '#45B7D1',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    accent: '#FF6B6B',
    error: '#FF5252',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
    success: '#4CAF50',
    warning: '#FF9800',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    tertiary: '#45B7D1',
    background: '#121212',
    surface: '#1E1E1E',
    accent: '#FF6B6B',
    error: '#FF5252',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
    success: '#4CAF50',
    warning: '#FF9800',
  },
};

export const defaultTheme = lightTheme;

export default defaultTheme;