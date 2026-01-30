export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:7005/api' 
  : 'https://api.swiftride.com/api';

export const SOCKET_URL = __DEV__ 
  ? 'http://localhost:7005' 
  : 'https://api.swiftride.com';

export const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

export const VEHICLE_TYPES = [
  { id: 'bike', name: 'Bike', icon: '🏍️', capacity: 1, baseFare: 15 },
  { id: 'auto', name: 'Auto', icon: '🚗', capacity: 3, baseFare: 25 },
  { id: 'sedan', name: 'Sedan', icon: '🚙', capacity: 4, baseFare: 40 },
  { id: 'suv', name: 'SUV', icon: '🚐', capacity: 6, baseFare: 60 },
  { id: 'premium', name: 'Premium', icon: '🚘', capacity: 4, baseFare: 80 },
];

export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: '💵' },
  { id: 'card', name: 'Card', icon: '💳' },
  { id: 'wallet', name: 'Wallet', icon: '💼' },
  { id: 'upi', name: 'UPI', icon: '📱' },
];

export const RIDE_STATUS = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const MAP_STYLES = {
  default: [],
  dark: [
    {
      elementType: 'geometry',
      stylers: [{ color: '#212121' }],
    },
    {
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#757575' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#212121' }],
    },
    {
      featureType: 'administrative',
      elementType: 'geometry',
      stylers: [{ color: '#757575' }],
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ color: '#424242' }],
    },
  ],
};

export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
};