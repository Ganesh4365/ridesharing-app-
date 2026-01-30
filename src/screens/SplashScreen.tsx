import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const SplashScreen = ({ navigation }: any) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const { theme } = useTheme();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        navigation.replace('Onboarding');
      }, 1000);
    });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.logoText, { color: theme.colors.background }]}>
            SR
          </Text>
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          SwiftRide
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Your journey, our priority
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SplashScreen;