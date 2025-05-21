import React from 'react';
import { LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logout } from '@/redux/slices/authSlice';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

const UserMenu: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  // Redux dan foydalanuvchi ma'lumotlarini olish
  const user = useAppSelector((state: any) => state.auth.user);
  
  // Chiqish funksiyasi
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
  
  // Foydalanuvchi ismidan foydalanib Avatar uchun harflar olish
  const getInitials = () => {
    if (!user?.name) return 'FM';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (
      nameParts[0].charAt(0).toUpperCase() + 
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || 'Foydalanuvchi'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.role || 'Boss'}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => {}}>
          <User className="mr-2 h-4 w-4" />
          <span>Profil</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Sozlamalar</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Chiqish</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;