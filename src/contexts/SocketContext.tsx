import React, { createContext, useState, useEffect, ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';
import { SOCKET_URL, API_BASE_URL } from '../constants';
import { User, Ride, Location } from '../types';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRide: (rideId: string) => void;
  leaveRide: (rideId: string) => void;
  requestRide: (rideData: any) => void;
  acceptRide: (rideId: string) => void;
  updateLocation: (location: Location) => void;
  sendMessage: (rideId: string, message: string) => void;
}

export const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: `Bearer ${user.id}`,
          userId: user.id,
          role: user.role,
        },
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        newSocket.emit('join_room', { roomId: user.id });
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('driver_assigned', (data) => {
        console.log('Driver assigned:', data);
      });

      newSocket.on('location_update', (data) => {
        console.log('Location update:', data);
      });

      newSocket.on('ride_status_change', (data) => {
        console.log('Ride status change:', data);
      });

      newSocket.on('new_ride_request', (data) => {
        console.log('New ride request:', data);
      });

      newSocket.on('message_received', (data) => {
        console.log('Message received:', data);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  const joinRide = (rideId: string) => {
    if (socket && isConnected) {
      socket.emit('join_room', { roomId: rideId });
    }
  };

  const leaveRide = (rideId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_room', { roomId: rideId });
    }
  };

  const requestRide = (rideData: any) => {
    if (socket && isConnected) {
      socket.emit('request_ride', rideData);
    }
  };

  const acceptRide = (rideId: string) => {
    if (socket && isConnected) {
      socket.emit('accept_ride', { rideId, driverId: user?.id });
    }
  };

  const updateLocation = (location: Location) => {
    if (socket && isConnected) {
      socket.emit('update_location', { location, userId: user?.id });
    }
  };

  const sendMessage = (rideId: string, message: string) => {
    if (socket && isConnected) {
      socket.emit('send_message', { rideId, message, senderId: user?.id });
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      joinRide,
      leaveRide,
      requestRide,
      acceptRide,
      updateLocation,
      sendMessage,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = React.useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};