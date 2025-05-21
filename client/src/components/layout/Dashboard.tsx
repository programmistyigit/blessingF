import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationDrawer from './NotificationDrawer';
import { useNotifications } from '@/contexts/NotificationContext';

interface DashboardProps {
  children: ReactNode;
}

const Dashboard: React.FC<DashboardProps> = ({ children }) => {
  const { showNotificationDrawer } = useNotifications();
  
  return (
    <div className="flex h-screen bg-neutral-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-100">
        {/* Header */}
        <Header />
        
        {/* Content */}
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
      
      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={showNotificationDrawer}
      />
    </div>
  );
};

export default Dashboard;
