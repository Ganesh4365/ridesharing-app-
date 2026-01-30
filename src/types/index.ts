export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'rider' | 'driver';
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Driver extends User {
  role: 'driver';
  vehicleType: 'bike' | 'auto' | 'sedan' | 'suv' | 'premium';
  vehicleNumber: string;
  licenseNumber: string;
  isOnline: boolean;
  currentLocation?: Location;
  earnings?: number;
  totalRides?: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  pickup: Location;
  dropoff: Location;
  vehicleType: 'bike' | 'auto' | 'sedan' | 'suv' | 'premium';
  status: 'requested' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  fare: number;
  distance: number;
  duration: number;
  estimatedTime: number;
  driverEta?: number;
  paymentMethod: 'cash' | 'card' | 'wallet' | 'upi';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface RideRequest {
  id: string;
  riderId: string;
  pickup: Location;
  dropoff: Location;
  vehicleType: string;
  fare: number;
  distance: number;
  estimatedTime: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  rideId: string;
  amount: number;
  method: 'cash' | 'card' | 'wallet' | 'upi';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  rideId: string;
  rating: number;
  comment?: string;
  userId: string;
  targetUserId: string;
  createdAt: string;
}

export interface SocketEvents {
  // Client to Server
  join_room: (data: { roomId: string }) => void;
  leave_room: (data: { roomId: string }) => void;
  request_ride: (data: RideRequest) => void;
  accept_ride: (data: { rideId: string; driverId: string }) => void;
  update_location: (data: { location: Location; userId: string }) => void;
  cancel_ride: (data: { rideId: string; reason?: string }) => void;
  send_message: (data: { rideId: string; message: string; senderId: string }) => void;
  
  // Server to Client
  driver_assigned: (data: { driver: Driver; estimatedTime: number }) => void;
  location_update: (data: { location: Location; userId: string }) => void;
  ride_status_change: (data: { rideId: string; status: Ride['status'] }) => void;
  new_ride_request: (data: RideRequest) => void;
  message_received: (data: { message: string; senderId: string; timestamp: string }) => void;
  ride_cancelled: (data: { rideId: string; reason?: string }) => void;
}

export interface NavigationProp {
  navigation: any;
  route: any;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}