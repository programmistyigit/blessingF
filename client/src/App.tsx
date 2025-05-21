import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { isAuthenticated } from "./lib/auth";
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { WebSocketService } from './services/WebSocketService';
import { checkAuthState } from './redux/slices/authSlice';

// Pages
import Login from "@/pages/auth/Login";
import DashboardPage from "@/pages/DashboardPage";
import EmployeesPage from "@/pages/EmployeesPage";
import PositionsPage from "@/pages/PositionsPage";
import AttendancePage from "@/pages/AttendancePage";
import BatchesPage from "@/pages/BatchesPage";
import SectionsPage from "@/pages/SectionsPage";
import SlaughterPage from "@/pages/SlaughterPage";
import InventoryPage from "@/pages/InventoryPage";
import ReportsPage from "@/pages/ReportsPage";
import CanteenPage from "@/pages/CanteenPage";
import TasksPage from "@/pages/TasksPage";
import MeatProductionPage from "@/pages/MeatProductionPage";
import FinancePage from "@/pages/FinancePage";
import PeriodsPage from "@/pages/PeriodsPage";
import SettingsPage from "@/pages/SettingsPage";
import TrashPage from "@/pages/TrashPage";
import NotFound from "@/pages/not-found";

import { PrimeReactProvider, PrimeReactContext } from 'primereact/api';
        

// Layout Components
import Dashboard from "@/components/layout/Dashboard";

// Create custom Redirect component
const Redirect = ({ to }: { to: string }) => {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
};

// Protected Route component - faqat login qilingan foydalanuvchilar uchun
const ProtectedComponent = ({ component: Component, ...rest }: any) => {
  // Auth tekshirish va kerakli sahifaga yo'naltirish
  if (!isAuthenticated()) {
    return <Redirect to="/auth" />;
  }

  return <Component {...rest} />;
};

// Asosiy Router
function Router() {
  // Jo'natuvchi qismlar
  const [, setLocation] = useLocation();

  return (
    <Switch>
      <Route path="/auth" component={Login} />

      <Route path="/">
        <Dashboard>
          <ProtectedComponent component={DashboardPage} />
        </Dashboard>
      </Route>

      <Route path="/employees">
        <Dashboard>
          <ProtectedComponent component={EmployeesPage} />
        </Dashboard>
      </Route>

      <Route path="/positions">
        <Dashboard>
          <ProtectedComponent component={PositionsPage} />
        </Dashboard>
      </Route>

      <Route path="/attendance">
        <Dashboard>
          <ProtectedComponent component={AttendancePage} />
        </Dashboard>
      </Route>

      <Route path="/batches">
        <Dashboard>
          <ProtectedComponent component={BatchesPage} />
        </Dashboard>
      </Route>

      <Route path="/sections">
        <Dashboard>
          <ProtectedComponent component={SectionsPage} />
        </Dashboard>
      </Route>

      <Route path="/slaughter">
        <Dashboard>
          <ProtectedComponent component={SlaughterPage} />
        </Dashboard>
      </Route>

      <Route path="/inventory">
        <Dashboard>
          <ProtectedComponent component={InventoryPage} />
        </Dashboard>
      </Route>

      <Route path="/reports">
        <Dashboard>
          <ProtectedComponent component={ReportsPage} />
        </Dashboard>
      </Route>

      <Route path="/canteen">
        <Dashboard>
          <ProtectedComponent component={CanteenPage} />
        </Dashboard>
      </Route>

      <Route path="/tasks">
        <Dashboard>
          <ProtectedComponent component={TasksPage} />
        </Dashboard>
      </Route>

      <Route path="/meat-production">
        <Dashboard>
          <ProtectedComponent component={MeatProductionPage} />
        </Dashboard>
      </Route>

      <Route path="/finance">
        <Dashboard>
          <ProtectedComponent component={FinancePage} />
        </Dashboard>
      </Route>

      <Route path="/periods">
        <Dashboard>
          <ProtectedComponent component={PeriodsPage} />
        </Dashboard>
      </Route>

      <Route path="/settings">
        <Dashboard>
          <ProtectedComponent component={SettingsPage} />
        </Dashboard>
      </Route>

      <Route path="/trash">
        <Dashboard>
          <ProtectedComponent component={TrashPage} />
        </Dashboard>
      </Route>

      <Route>
        <Dashboard>
          <NotFound />
        </Dashboard>
      </Route>
    </Switch>
  );
}

function App() {
  const [isReady, setIsReady] = useState(false);

  // Redux-dan auth holati tekshirish
  useEffect(() => {
    store.dispatch(checkAuthState());

    // WebSocket xizmatini ishga tushirish
    if (isAuthenticated()) {
      try {
        WebSocketService.connect();
      } catch (error) {
        console.error("WebSocket ulanishda xatolik:", error);
      }
    }

    setIsReady(true);

    // Component unmount bo'lganda WebSocket ulanishni uzish
    return () => {
      if (WebSocketService.isConnected()) {
        WebSocketService.disconnect();
      }
    };
  }, []);

  if (!isReady) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const value = {
        zIndex: {
            modal: 1100,    // dialog, sidebar
            overlay: 1000,  // dropdown, overlaypanel
            menu: 1000,     // overlay menus
            tooltip: 1100   // tooltip
        },
        autoZIndex: true,
      }
  return (
    <Provider store={store}>
        <PrimeReactProvider value={value}>
      <QueryClientProvider client={queryClient}>

          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
      </QueryClientProvider>
        </PrimeReactProvider>
    </Provider>
  );
}

export default App;
