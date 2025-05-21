import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { WebSocketEventType } from '@/lib/websocket';

interface NotificationDrawerProps {
  isOpen: boolean;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen }) => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications,
    toggleNotificationDrawer 
  } = useNotifications();
  
  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case WebSocketEventType.EMERGENCY_ALERT:
        return <AlertCircle className="h-4 w-4" />;
      case WebSocketEventType.PRODUCTION_REPORT:
        return <CheckCircle className="h-4 w-4" />;
      case WebSocketEventType.INVENTORY_ALERT:
        return <AlertTriangle className="h-4 w-4" />;
      case WebSocketEventType.READY_FOR_SLAUGHTER:
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  // Get background color based on notification type
  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case WebSocketEventType.EMERGENCY_ALERT:
        return 'bg-danger';
      case WebSocketEventType.PRODUCTION_REPORT:
        return 'bg-success';
      case WebSocketEventType.INVENTORY_ALERT:
        return 'bg-warning';
      case WebSocketEventType.READY_FOR_SLAUGHTER:
        return 'bg-info';
      default:
        return 'bg-primary';
    }
  };
  
  return (
    <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
          <h2 className="font-heading font-semibold text-neutral-800">Xabarlar</h2>
          <button 
            className="text-neutral-400 hover:text-neutral-600"
            onClick={toggleNotificationDrawer}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {notifications.length > 0 && (
          <div className="px-6 py-2 border-b border-neutral-200 flex justify-between items-center">
            <button
              className="text-xs text-primary hover:text-primary-dark"
              onClick={markAllAsRead}
            >
              Hammasini o'qilgan deb belgilash
            </button>
            <button
              className="text-xs text-neutral-500 hover:text-neutral-700"
              onClick={clearAllNotifications}
            >
              Tozalash
            </button>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="text-center text-neutral-500 py-10">
              <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-neutral-400" />
              </div>
              <p>Hozircha xabarlar yo'q</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`bg-neutral-100 p-4 rounded ${!notification.read ? 'border-l-4 border-primary' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start">
                    <div className={`${getNotificationBgColor(notification.type)} text-white p-2 rounded-full`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <h3 className="text-sm font-medium">{notification.title}</h3>
                        <button
                          className="text-neutral-400 hover:text-neutral-600 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-neutral-500 mt-2">
                        {formatDate(notification.timestamp, "HH:mm - dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add missing Bell icon reference
const Bell = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

export default NotificationDrawer;
