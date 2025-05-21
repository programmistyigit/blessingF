import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeWebSocket, addWebSocketEventHandler, removeWebSocketEventHandler, WebSocketEventType, closeWebSocketConnection } from '@/lib/websocket';
// Circular dependency oldini olish uchun, useAuth'ni to'g'ridan-to'g'ri import qilmaymiz
import { isAuthenticated as checkIsAuthenticated } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showNotificationDrawer: boolean;
  toggleNotificationDrawer: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
  clearAllNotifications: () => {},
  showNotificationDrawer: false,
  toggleNotificationDrawer: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  // Auth konteksti bilan circular dependency muammosi oldini olish uchun 
  // auth.ts dan to'g'ridan-to'g'ri funksiyani chaqiramiz
  const isAuthenticated = checkIsAuthenticated();

  // Initialize WebSocket connection when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const socket = initializeWebSocket();
      
      // Set up event handlers for different notification types
      const handleProductionReport = (data: any) => {
        addNotification({
          id: Date.now().toString(),
          type: WebSocketEventType.PRODUCTION_REPORT,
          title: 'New Production Report',
          message: data.message || 'A new production report is available.',
          timestamp: new Date(),
          read: false
        });
      };
      
      const handleInventoryAlert = (data: any) => {
        addNotification({
          id: Date.now().toString(),
          type: WebSocketEventType.INVENTORY_ALERT,
          title: 'Inventory Alert',
          message: data.message || 'Inventory item is low on stock.',
          timestamp: new Date(),
          read: false
        });
        
        toast({
          title: "Inventory Alert",
          description: data.message || 'Inventory item is low on stock.',
          variant: "destructive",
        });
      };
      
      const handleReadyForSlaughter = (data: any) => {
        addNotification({
          id: Date.now().toString(),
          type: WebSocketEventType.READY_FOR_SLAUGHTER,
          title: 'Ready for Slaughter',
          message: data.message || 'A batch is ready for slaughter.',
          timestamp: new Date(),
          read: false
        });
      };
      
      const handleEmergencyAlert = (data: any) => {
        addNotification({
          id: Date.now().toString(),
          type: WebSocketEventType.EMERGENCY_ALERT,
          title: 'Emergency Alert',
          message: data.message || 'An emergency situation has been reported.',
          timestamp: new Date(),
          read: false
        });
        
        toast({
          title: "Emergency Alert",
          description: data.message || 'An emergency situation has been reported.',
          variant: "destructive",
        });
      };
      
      // Register WebSocket event handlers
      addWebSocketEventHandler(WebSocketEventType.PRODUCTION_REPORT, handleProductionReport);
      addWebSocketEventHandler(WebSocketEventType.INVENTORY_ALERT, handleInventoryAlert);
      addWebSocketEventHandler(WebSocketEventType.READY_FOR_SLAUGHTER, handleReadyForSlaughter);
      addWebSocketEventHandler(WebSocketEventType.EMERGENCY_ALERT, handleEmergencyAlert);
      
      // Clean up event handlers when component unmounts
      return () => {
        removeWebSocketEventHandler(WebSocketEventType.PRODUCTION_REPORT, handleProductionReport);
        removeWebSocketEventHandler(WebSocketEventType.INVENTORY_ALERT, handleInventoryAlert);
        removeWebSocketEventHandler(WebSocketEventType.READY_FOR_SLAUGHTER, handleReadyForSlaughter);
        removeWebSocketEventHandler(WebSocketEventType.EMERGENCY_ALERT, handleEmergencyAlert);
        closeWebSocketConnection();
      };
    }
  }, [isAuthenticated]);

  // Calculate unread notifications count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Add a new notification
  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Delete a notification
  const deleteNotification = (id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Toggle notification drawer
  const toggleNotificationDrawer = () => {
    setShowNotificationDrawer(prev => !prev);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        showNotificationDrawer,
        toggleNotificationDrawer
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
