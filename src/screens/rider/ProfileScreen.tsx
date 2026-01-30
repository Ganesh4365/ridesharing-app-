import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Avatar,
  List,
  useTheme as usePaperTheme,
  Switch,
} from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const ProfileScreen = ({ navigation }: any) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [locationServices, setLocationServices] = useState(true);
  
  const theme = useTheme();
  const paperTheme = usePaperTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      title: 'Personal Information',
      description: 'Update your personal details',
      icon: 'account',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      title: 'Payment Methods',
      description: 'Manage your payment options',
      icon: 'credit-card',
      onPress: () => navigation.navigate('PaymentMethods'),
    },
    {
      title: 'Ride History',
      description: 'View your past rides',
      icon: 'history',
      onPress: () => navigation.navigate('RideHistory'),
    },
    {
      title: 'Emergency Contacts',
      description: 'Set up emergency contacts',
      icon: 'phone',
      onPress: () => navigation.navigate('EmergencyContacts'),
    },
    {
      title: 'Help & Support',
      description: 'Get help with the app',
      icon: 'help-circle',
      onPress: () => navigation.navigate('Help'),
    },
    {
      title: 'Terms & Privacy',
      description: 'Read our terms and privacy policy',
      icon: 'file-document',
      onPress: () => navigation.navigate('Terms'),
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.theme.colors.primary }]}>
            <Text style={styles.avatarText}>
              {user ? getInitials(user.name) : 'U'}
            </Text>
          </View>
          <Text style={[styles.name, { color: theme.theme.colors.text }]}>
            {user?.name || 'Guest User'}
          </Text>
          <Text style={[styles.email, { color: theme.theme.colors.textSecondary }]}>
            {user?.email || 'user@example.com'}
          </Text>
          <Text style={[styles.phone, { color: theme.theme.colors.textSecondary }]}>
            {user?.phone || '+91 98765 43210'}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, { backgroundColor: theme.theme.colors.surface }]}>
            <Text style={[styles.statNumber, { color: theme.theme.colors.primary }]}>
              42
            </Text>
            <Text style={[styles.statLabel, { color: theme.theme.colors.textSecondary }]}>
              Total Rides
            </Text>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: theme.theme.colors.surface }]}>
            <Text style={[styles.statNumber, { color: theme.theme.colors.primary }]}>
              4.8
            </Text>
            <Text style={[styles.statLabel, { color: theme.theme.colors.textSecondary }]}>
              Rating
            </Text>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: theme.theme.colors.surface }]}>
            <Text style={[styles.statNumber, { color: theme.theme.colors.primary }]}>
              ₹2.5K
            </Text>
            <Text style={[styles.statLabel, { color: theme.theme.colors.textSecondary }]}>
              Saved
            </Text>
          </Card>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: theme.theme.colors.surface }]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: theme.theme.colors.primary + '20' }]}>
                  <Text style={[styles.menuIconText, { color: theme.theme.colors.primary }]}>
                    {item.title.charAt(0)}
                  </Text>
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuTitle, { color: theme.theme.colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.menuDescription, { color: theme.theme.colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
              <Text style={[styles.menuArrow, { color: theme.theme.colors.textSecondary }]}>
                ›
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings */}
        <View style={styles.settingsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.theme.colors.text }]}>
            Settings
          </Text>
          
          <View style={[styles.settingItem, { backgroundColor: theme.theme.colors.surface }]}>
            <View style={styles.settingLeft}>
              <Text style={[styles.settingTitle, { color: theme.theme.colors.text }]}>
                Push Notifications
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              color={theme.theme.colors.primary}
            />
          </View>
          
          <View style={[styles.settingItem, { backgroundColor: theme.theme.colors.surface }]}>
            <View style={styles.settingLeft}>
              <Text style={[styles.settingTitle, { color: theme.theme.colors.text }]}>
                Location Services
              </Text>
            </View>
            <Switch
              value={locationServices}
              onValueChange={setLocationServices}
              color={theme.theme.colors.primary}
            />
          </View>
          
          <View style={[styles.settingItem, { backgroundColor: theme.theme.colors.surface }]}>
            <View style={styles.settingLeft}>
              <Text style={[styles.settingTitle, { color: theme.theme.colors.text }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              color={theme.theme.colors.primary}
            />
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            contentStyle={styles.buttonContent}
          >
            Logout
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  menuContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 14,
  },
  menuArrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  settingsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutContainer: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  logoutButton: {
    borderColor: '#F44336',
  },
  buttonContent: {
    paddingVertical: 12,
  },
});

export default ProfileScreen;