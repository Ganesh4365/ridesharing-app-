import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  Dimensions 
} from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'The perfect ride is just a tap away!',
    description: 'Your journey begins with SwiftRide. Find your ideal ride effortlessly.',
    image: '🚗',
  },
  {
    id: 2,
    title: 'Best car in your hands with SwiftRide',
    description: 'Discover the convenience of finding your perfect ride with SwiftRide.',
    image: '🚙',
  },
  {
    id: 3,
    title: 'Your ride, your way. Let\'s go!',
    description: 'Enter your destination, sit back, and let us take care of the rest.',
    image: '🏍️',
  },
];

const OnboardingScreen = ({ navigation }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const theme = useTheme();
  const appTheme = useAppTheme();

  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: index * width, animated: true });
    }
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      scrollToIndex(currentIndex + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  const handleGetStarted = () => {
    navigation.replace('Login');
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.slide, { width, backgroundColor: appTheme.theme.colors.background }]}>
      <View style={styles.imageContainer}>
        <Text style={styles.emoji}>{item.image}</Text>
      </View>
      <Text style={[styles.title, { color: appTheme.theme.colors.text }]}>
        {item.title}
      </Text>
      <Text style={[styles.description, { color: appTheme.theme.colors.textSecondary }]}>
        {item.description}
      </Text>
      {index === onboardingData.length - 1 && (
        <Button
          mode="contained"
          onPress={handleGetStarted}
          style={[styles.getStartedButton, { backgroundColor: appTheme.theme.colors.primary }]}
          contentStyle={styles.buttonContent}
        >
          Get Started
        </Button>
      )}
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {onboardingData.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentIndex 
                ? appTheme.theme.colors.primary 
                : appTheme.theme.colors.border,
              width: index === currentIndex ? 24 : 8,
            },
          ]}
          onPress={() => {
            setCurrentIndex(index);
            scrollToIndex(index);
          }}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: appTheme.theme.colors.background }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      >
        {onboardingData.map((item, index) => renderItem({ item, index }))}
      </ScrollView>

      <View style={styles.footer}>
        {renderPagination()}
        {currentIndex < onboardingData.length - 1 && (
          <View style={styles.buttonContainer}>
            <Button
              mode="text"
              onPress={handleSkip}
              style={styles.skipButton}
              textColor={appTheme.theme.colors.textSecondary}
            >
              Skip
            </Button>
            <Button
              mode="contained"
              onPress={handleNext}
              style={[styles.nextButton, { backgroundColor: appTheme.theme.colors.primary }]}
              contentStyle={styles.buttonContent}
            >
              Next
            </Button>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageContainer: {
    marginBottom: 40,
  },
  emoji: {
    fontSize: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  getStartedButton: {
    paddingHorizontal: 40,
  },
  buttonContent: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    transition: 'all 0.3s ease',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
});

export default OnboardingScreen;