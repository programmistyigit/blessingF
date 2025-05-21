import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { getUser } from '@/lib/auth';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logout } from '@/redux/slices/authSlice';
import { useToast } from '@/hooks/use-toast';
import {
  Home,
  Users,
  UserCog,
  Package,
  Settings,
  BarChart2,
  Clipboard,
  ClipboardCheck,
  Coffee,
  CheckSquare,
  LogOut,
  Factory,
  Briefcase,
  Scissors,
  DollarSign,
  Timer,
  Trash2
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const [location, setLocation] = useLocation();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  // Redux dan foydalanuvchi ma'lumotlarini olish
  const reduxUser = useAppSelector((state: any) => state.auth.user);
  
  // Lokal User ma'lumotlarini olish (Redux uchun fallback)
  const localUser = getUser();
  
  // Qaysi userdan foydalanish
  const user = reduxUser || localUser;
  
  // Tizimdan chiqish funksiyasi
  const handleLogout = () => {
    // Redux action chaqirish
    dispatch(logout());
    
    // Xabar ko'rsatish
    toast({
      title: "Tizimdan chiqildi",
      description: "Siz tizimdan muvaffaqiyatli chiqib kettingiz"
    });
    
    // Login sahifasiga o'tkazish
    setLocation('/auth');
  };
  
  // Check if user is admin (boss role)
  const isAdmin = user?.role === 'boss' || user?.role === 'owner';
  
  // Navigation items
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home className="h-5 w-5 mr-3" /> },
    { name: 'Xodimlar', path: '/employees', icon: <Users className="h-5 w-5 mr-3" /> },
    { name: 'Lavozimlar', path: '/positions', icon: <Briefcase className="h-5 w-5 mr-3" />, admin: true },
    { name: "Yo'qlama", path: '/attendance', icon: <ClipboardCheck className="h-5 w-5 mr-3" /> },
    { name: 'Sexlar', path: '/sections', icon: <Factory className="h-5 w-5 mr-3" /> },
    { name: 'Tovuq Partiyalari', path: '/batches', icon: <Package className="h-5 w-5 mr-3" /> },
    { name: 'Davrlar', path: '/periods', icon: <Timer className="h-5 w-5 mr-3" /> },
    { name: "So'yish Boshqaruvi", path: '/slaughter', icon: <Settings className="h-5 w-5 mr-3" /> },
    { name: "Go'sht Ishlab Chiqarish", path: '/meat-production', icon: <Scissors className="h-5 w-5 mr-3" /> },
    { name: 'Inventar', path: '/inventory', icon: <Clipboard className="h-5 w-5 mr-3" /> },
    { name: 'Vazifalar', path: '/tasks', icon: <CheckSquare className="h-5 w-5 mr-3" /> },
    { name: 'Moliya', path: '/finance', icon: <DollarSign className="h-5 w-5 mr-3" /> },
    { name: 'Hisobotlar', path: '/reports', icon: <BarChart2 className="h-5 w-5 mr-3" /> },
    { name: 'Oshxona Boshqaruvi', path: '/canteen', icon: <Coffee className="h-5 w-5 mr-3" /> },
    { name: "O'chirilgan Ma'lumotlar", path: '/trash', icon: <Trash2 className="h-5 w-5 mr-3" />, admin: true },
  ];
  
  return (
    <aside className="bg-neutral-800 text-white w-64 flex flex-col h-full shadow-lg" style={{ minWidth: '16rem' }}>
      {/* Logo and Title */}
      <div className="p-4 border-b border-neutral-700 flex items-center gap-3">
        <div className="h-10 w-10 rounded bg-primary flex items-center justify-center text-white font-bold">
          FM
        </div>
        <div>
          <h1 className="font-heading font-bold text-lg">Ferma Boshqaruv</h1>
          <p className="text-xs text-neutral-400">Bo'lim boshlig'i paneli</p>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="overflow-y-auto flex-grow">
        <nav className="p-2">
          {navItems.map((item) => {
            // Admin menyularini faqat admin ko'rsin
            if (item.admin && !isAdmin) {
              return null;
            }
            
            return (
              <div
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={cn(
                  "px-4 py-3 rounded hover:bg-neutral-700 mb-1 cursor-pointer flex items-center",
                  location === item.path && "border-l-4 border-primary bg-opacity-10 bg-primary"
                )}
              >
                {item.icon}
                <span>{item.name}</span>
              </div>
            );
          })}
        </nav>
      </div>
      
      {/* User Profile */}
      <div className="p-4 border-t border-neutral-700 mt-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-neutral-700 flex items-center justify-center text-white">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-medium text-sm">{user?.name || 'User'}</h3>
            <p className="text-xs text-neutral-400">Bo'lim boshlig'i</p>
          </div>
          <button 
            className="ml-auto text-neutral-400 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
