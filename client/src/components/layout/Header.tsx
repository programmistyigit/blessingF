import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import UserMenu from './UserMenu';

const Header: React.FC = () => {
  const { unreadCount, toggleNotificationDrawer } = useNotifications();
  const [location] = useLocation();
  
  // Get page title based on current location
  const getPageTitle = (): string => {
    switch (location) {
      case '/':
        return 'Dashboard';
      case '/employees':
        return 'Xodimlar';
      case '/batches':
        return 'Tovuq Partiyalari';
      case '/slaughter':
        return "So'yish Boshqaruvi";
      case '/inventory':
        return 'Inventar';
      case '/reports':
        return 'Hisobotlar';
      case '/canteen':
        return 'Oshxona Boshqaruvi';
      default:
        return 'Ferma Boshqaruv Tizimi';
    }
  };
  
  return (
    <div className="flex justify-between items-center mb-6 py-4 px-6 border-b border-neutral-200 bg-white shadow-sm">
      <h1 className="text-2xl font-heading font-bold text-neutral-800">{getPageTitle()}</h1>
      
      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <div className="relative">
          <button 
            className="p-2 bg-white rounded-full shadow hover:bg-neutral-100 focus:outline-none"
            onClick={toggleNotificationDrawer}
          >
            <Bell className="h-6 w-6 text-neutral-600" />
            {unreadCount > 0 && (
              <span className={cn(
                "absolute top-0 right-0 h-2 w-2 mt-1 mr-1 rounded-full bg-danger",
                unreadCount > 0 && "animate-pulse"
              )}></span>
            )}
          </button>
        </div>
        
        {/* User Menu */}
        <UserMenu />
      </div>
    </div>
  );
};

export default Header;
