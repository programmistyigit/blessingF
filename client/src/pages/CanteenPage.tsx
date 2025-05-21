import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  getDailyMenu, createDailyMenu, updateDailyMenu,
  getDishes, getMenus, createMenu, updateMenu, updateMenuStatus,
  getMenuById, getIngredients, getMealSessions, getCanteenVotings,
  createDish, createIngredient, updateDish, updateDishStatus
} from '@/lib/api';
import { getUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Calendar, CalendarIcon, Plus, Filter, Coffee, UtensilsCrossed, 
  ChevronRight, MoreHorizontal, Utensils, Users, Clock, FileEdit,
  BarChart, Search, Trash2, Check, AlertCircle, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

// Taom modeli
interface Dish {
  id: string;
  name: string;
  description?: string;
  category: string; // breakfast, lunch, dinner, dessert, drink
  type: string; // main, soup, salad, dessert, drink
  defaultQuantity: number;
  unit: string;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    [key: string]: any;
  };
  ingredients?: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    cost?: number;
  }>;
  preparationSteps?: string[];
  cost?: number;
  preparationTime?: number;
  allergens?: string[];
  isActive: boolean;
  image?: string;
  popularity?: {
    rating: number;
    voteCount: number;
    lastServed?: string;
    servedCount: number;
  };
}

// Menyu modeli
interface Menu {
  id: string;
  name: string;
  description?: string;
  type: string; // daily, weekly, special
  status: string; // draft, active, inactive
  startDate: string;
  endDate: string;
  mealTypes: string[]; // breakfast, lunch, dinner
  days?: any[]; // kunlar bo'yicha menyular
  nutritionalInfo?: {
    averageCaloriesPerDay: number;
    averageProteinPerDay: number;
    averageFatPerDay: number;
    averageCarbsPerDay: number;
  };
  costInfo?: {
    totalCostPerDay: number;
    totalCostForPeriod: number;
    averageCostPerMeal: number;
  };
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    updatedBy: {
      id: string;
      name: string;
    };
    notes?: string;
  }>;
}

// Ingredient modeli
interface Ingredient {
  id: string;
  name: string;
  description?: string;
  unit: string;
  cost: number;
  stockQuantity: number;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    [key: string]: any;
  };
  allergens?: string[];
  supplier?: string;
  reorderLevel?: number;
}

// Ovqatlanish sessiyasi modeli
interface MealSession {
  id: string;
  date: string;
  type: string; // breakfast, lunch, dinner
  startTime: string;
  endTime: string;
  status: string; // planned, active, completed, cancelled
  attendance: number;
  menu: {
    id: string;
    name: string;
  };
  notes?: string;
}

// Ovoz berish modeli
interface CanteenVoting {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  options: Array<{
    dishId: string;
    dishName: string;
    votes: number;
  }>;
}

const CanteenPage: React.FC = () => {
  const user = getUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("menus");
  const [showAddDishDialog, setShowAddDishDialog] = useState(false);
  const [showAddMenuDialog, setShowAddMenuDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [dishSearchQuery, setDishSearchQuery] = useState<string>("");
  const [dishCategoryFilter, setDishCategoryFilter] = useState<string>("");
  
  // Taomlar API'sidan ma'lumotlarni olish
  const { data: dishesData, isLoading: isLoadingDishes } = useQuery({
    queryKey: ['/api/canteen/dishes', dishSearchQuery, dishCategoryFilter],
    queryFn: () => getDishes({ 
      search: dishSearchQuery || undefined, 
      category: dishCategoryFilter || undefined 
    }),
    enabled: !!user && activeTab === "dishes",
  });
  
  // Menyular API'sidan ma'lumotlarni olish
  const { data: menusData, isLoading: isLoadingMenus } = useQuery({
    queryKey: ['/api/canteen/menus'],
    queryFn: () => getMenus(),
    enabled: !!user && activeTab === "menus",
  });
  
  // Kunlik menyu (Daily menu) API'sidan ma'lumotlarni olish
  const { data: dailyMenuData, isLoading: isLoadingDailyMenu } = useQuery({
    queryKey: ['/api/canteen/daily-menu', selectedDate],
    queryFn: () => getDailyMenu(selectedDate),
    enabled: !!user && activeTab === "daily-menu",
  });
  
  // Oziq-ovqat ingredientlari API'sidan ma'lumotlarni olish
  const { data: ingredientsData, isLoading: isLoadingIngredients } = useQuery({
    queryKey: ['/api/canteen/ingredients'],
    queryFn: () => getIngredients(),
    enabled: !!user && (activeTab === "ingredients" || showAddDishDialog),
  });
  
  // Ovqatlanish sessiyalari API'sidan ma'lumotlarni olish
  const { data: mealSessionsData, isLoading: isLoadingMealSessions } = useQuery({
    queryKey: ['/api/canteen/meal-sessions'],
    queryFn: () => getMealSessions({ date: selectedDate }),
    enabled: !!user && activeTab === "meal-sessions",
  });
  
  // Ovoz berishlar API'sidan ma'lumotlarni olish
  const { data: votingsData, isLoading: isLoadingVotings } = useQuery({
    queryKey: ['/api/canteen/votings'],
    queryFn: () => getCanteenVotings({ isActive: true }),
    enabled: !!user && activeTab === "votings",
  });
  
  // API orqali olingan ma'lumotlarni qayta ishlash
  const dishes = Array.isArray(dishesData) ? dishesData as Dish[] : [];
  const menus = Array.isArray(menusData) ? menusData as Menu[] : [];
  const ingredients = Array.isArray(ingredientsData) ? ingredientsData as Ingredient[] : [];
  const mealSessions = Array.isArray(mealSessionsData) ? mealSessionsData as MealSession[] : [];
  const votings = Array.isArray(votingsData) ? votingsData as CanteenVoting[] : [];
  
  // Taom yaratish mutation
  const createDishMutation = useMutation({
    mutationFn: createDish,
    onSuccess: () => {
      setShowAddDishDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/canteen/dishes'] });
      toast({
        title: 'Muvaffaqiyatli qo\'shildi',
        description: 'Yangi taom ma\'lumotlari saqlandi.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Xatolik yuz berdi',
        description: error.toString(),
        variant: 'destructive',
      });
    }
  });
  
  // Taom statusini yangilash mutation
  const updateDishStatusMutation = useMutation({
    mutationFn: (data: { id: string, statusData: { isActive: boolean, notes?: string } }) => 
      updateDishStatus(data.id, data.statusData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/canteen/dishes'] });
      toast({
        title: 'Status yangilandi',
        description: 'Taom statusi muvaffaqiyatli yangilandi',
      });
    },
    onError: (error) => {
      toast({
        title: 'Xatolik yuz berdi',
        description: error.toString(),
        variant: 'destructive',
      });
    }
  });
  
  // Menyu yaratish mutation
  const createMenuMutation = useMutation({
    mutationFn: createMenu,
    onSuccess: () => {
      setShowAddMenuDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/canteen/menus'] });
      toast({
        title: 'Muvaffaqiyatli qo\'shildi',
        description: 'Yangi menyu ma\'lumotlari saqlandi.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Xatolik yuz berdi',
        description: error.toString(),
        variant: 'destructive',
      });
    }
  });
  
  // Menyu statusini yangilash mutation
  const updateMenuStatusMutation = useMutation({
    mutationFn: (data: { id: string, statusData: { status: string, notes?: string } }) => 
      updateMenuStatus(data.id, data.statusData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/canteen/menus'] });
      toast({
        title: 'Status yangilandi',
        description: 'Menyu statusi muvaffaqiyatli yangilandi',
      });
    },
    onError: (error) => {
      toast({
        title: 'Xatolik yuz berdi',
        description: error.toString(),
        variant: 'destructive',
      });
    }
  });
  
  // Taom kategoriyasi bo'yicha filter
  const dishCategories = [
    { value: "all", label: "Barcha kategoriyalar" },
    { value: "breakfast", label: "Nonushta" },
    { value: "lunch", label: "Tushlik" },
    { value: "dinner", label: "Kechki ovqat" },
    { value: "dessert", label: "Desert" },
    { value: "drink", label: "Ichimlik" }
  ];
  
  // Menyu turi bo'yicha filter
  const menuTypes = [
    { value: "all", label: "Barcha turlar" },
    { value: "daily", label: "Kunlik" },
    { value: "weekly", label: "Haftalik" },
    { value: "special", label: "Maxsus" }
  ];
  
  // Menyu statusi bo'yicha filter
  const menuStatuses = [
    { value: "all", label: "Barcha statuslar" },
    { value: "draft", label: "Qoralama" },
    { value: "active", label: "Faol" },
    { value: "inactive", label: "Faol emas" }
  ];
  
  // Taom qo'shish formasi
  const handleAddDish = (data: any) => {
    createDishMutation.mutate(data);
  };
  
  // Menyu qo'shish formasi
  const handleAddMenu = (data: any) => {
    createMenuMutation.mutate(data);
  };
  
  // Taom statusini yangilash
  const handleToggleDishStatus = (dish: Dish) => {
    updateDishStatusMutation.mutate({
      id: dish.id,
      statusData: {
        isActive: !dish.isActive,
        notes: dish.isActive ? 'Taom faol emas qilindi' : 'Taom faol qilindi'
      }
    });
  };
  
  // Menyu statusini yangilash
  const handleActivateMenu = (menu: Menu) => {
    updateMenuStatusMutation.mutate({
      id: menu.id,
      statusData: {
        status: menu.status === 'active' ? 'inactive' : 'active',
        notes: menu.status === 'active' ? 'Menyu faol emas qilindi' : 'Menyu faollashtirildi'
      }
    });
  };

  // Uzbek tilida vaqt formatini ko'rsatish
  const renderMealTime = (mealTime: string) => {
    switch (mealTime) {
      case 'breakfast':
        return 'Nonushta';
      case 'lunch':
        return 'Tushlik';
      case 'dinner':
        return 'Kechki ovqat';
      default:
        return mealTime;
    }
  };
  
  // Taom turini Uzbek tilida ko'rsatish
  const renderDishType = (type: string) => {
    switch (type) {
      case 'main':
        return 'Asosiy taom';
      case 'soup':
        return 'Sho\'rva';
      case 'salad':
        return 'Salat';
      case 'dessert':
        return 'Desert';
      case 'drink':
        return 'Ichimlik';
      default:
        return type;
    }
  };
  
  // Menyu turini Uzbek tilida ko'rsatish
  const renderMenuType = (type: string) => {
    switch (type) {
      case 'daily':
        return 'Kunlik';
      case 'weekly':
        return 'Haftalik';
      case 'special':
        return 'Maxsus';
      default:
        return type;
    }
  };
  
  // Menyu statusini Uzbek tilida ko'rsatish
  const renderMenuStatus = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Qoralama';
      case 'active':
        return 'Faol';
      case 'inactive':
        return 'Faol emas';
      default:
        return status;
    }
  };
  
  // Yuklash indikatori
  const isLoading = 
    isLoadingDishes || 
    isLoadingMenus || 
    isLoadingDailyMenu || 
    isLoadingIngredients || 
    isLoadingMealSessions || 
    isLoadingVotings;

  return (
    <div className="space-y-6">
      {/* Sarlavha */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Oshxona boshqaruvi</h1>
      </div>
      
      {/* Asosiy tab panel */}
      <Tabs defaultValue="menus" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="menus">
            <Coffee className="w-4 h-4 mr-2" /> Menyular
          </TabsTrigger>
          <TabsTrigger value="dishes">
            <Utensils className="w-4 h-4 mr-2" /> Taomlar
          </TabsTrigger>
          <TabsTrigger value="ingredients">
            <FileEdit className="w-4 h-4 mr-2" /> Ingredientlar
          </TabsTrigger>
          <TabsTrigger value="meal-sessions">
            <Users className="w-4 h-4 mr-2" /> Ovqatlanish
          </TabsTrigger>
          <TabsTrigger value="votings">
            <BarChart className="w-4 h-4 mr-2" /> Ovoz berishlar
          </TabsTrigger>
        </TabsList>
        
        {/* Menyular Tab */}
        <TabsContent value="menus" className="space-y-6">
          {isLoadingMenus ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : menus.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Coffee className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium mb-2">Menyu topilmadi</h3>
                <p className="text-gray-500 mb-4 text-center max-w-md">
                  Hozircha yaratilgan menyular mavjud emas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {menus.map(menu => (
                <Card key={menu.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{menu.name}</CardTitle>
                        <CardDescription>
                          {renderMenuType(menu.type)} menyu
                        </CardDescription>
                      </div>
                      <Badge
                        variant={menu.status === 'active' ? 'default' : 
                                menu.status === 'draft' ? 'outline' : 'secondary'}
                      >
                        {renderMenuStatus(menu.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {menu.description && (
                      <p className="text-sm text-gray-500 mb-3">{menu.description}</p>
                    )}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Sanasi</span>
                        <span>
                          {formatDate(menu.startDate)} - {formatDate(menu.endDate)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Vaqti</span>
                        <div className="flex space-x-1">
                          {menu.mealTypes.map(type => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {renderMealTime(type)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {menu.nutritionalInfo && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Kaloriya</span>
                          <span>{menu.nutritionalInfo.averageCaloriesPerDay} kcal/kun</span>
                        </div>
                      )}
                      {menu.costInfo && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Narx</span>
                          <span>{menu.costInfo.averageCostPerMeal.toLocaleString()} UZS</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50 px-6 py-3">
                    <div className="flex justify-between items-center w-full">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedMenu(menu)}
                      >
                        Batafsil
                      </Button>
                      <Button 
                        variant={menu.status === 'active' ? 'destructive' : 'default'} 
                        size="sm"
                        onClick={() => handleActivateMenu(menu)}
                      >
                        {menu.status === 'active' ? 'Faolsizlantirish' : 'Faollashtirish'}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Taomlar Tab */}
        <TabsContent value="dishes" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Taomni qidirish..."
                className="pl-10"
                value={dishSearchQuery}
                onChange={(e) => setDishSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={dishCategoryFilter}
              onValueChange={setDishCategoryFilter}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Kategoriya tanlash" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Kategoriyalar</SelectLabel>
                  {dishCategories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          {isLoadingDishes ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : dishes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Utensils className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium mb-2">Taom topilmadi</h3>
                <p className="text-gray-500 mb-4 text-center max-w-md">
                  {dishSearchQuery || dishCategoryFilter
                    ? "Qidiruv so'rovi bo'yicha taomlar topilmadi."
                    : "Hozircha yaratilgan taomlar mavjud emas."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {dishes.map(dish => (
                <Card key={dish.id} className={`overflow-hidden ${!dish.isActive ? 'opacity-70' : ''}`}>
                  <div className="relative">
                    {dish.image ? (
                      <div 
                        className="h-48 bg-cover bg-center w-full"
                        style={{ backgroundImage: `url(${dish.image})` }}
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-gray-100">
                        <Utensils className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    {!dish.isActive && (
                      <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
                        <Badge className="bg-red-500">Faol emas</Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{dish.name}</CardTitle>
                        <CardDescription>
                          {renderDishType(dish.type)}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700"
                      >
                        {renderMealTime(dish.category)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-2">
                    {dish.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{dish.description}</p>
                    )}
                    <div className="space-y-2">
                      {dish.nutritionalInfo && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Kaloriya</span>
                          <span>{dish.nutritionalInfo.calories} kcal</span>
                        </div>
                      )}
                      {dish.preparationTime && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Tayyorlash vaqti</span>
                          <span>{dish.preparationTime} daqiqa</span>
                        </div>
                      )}
                      {dish.cost !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Narx</span>
                          <span>{dish.cost.toLocaleString()} UZS</span>
                        </div>
                      )}
                      {dish.ingredients && dish.ingredients.length > 0 && (
                        <div className="text-sm">
                          <span className="text-gray-500 block mb-1">Ingredientlar</span>
                          <div className="flex flex-wrap gap-1">
                            {dish.ingredients.slice(0, 4).map(ing => (
                              <Badge key={ing.id} variant="outline" className="text-xs">
                                {ing.name}
                              </Badge>
                            ))}
                            {dish.ingredients.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{dish.ingredients.length - 4} ta
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50 px-6 py-3">
                    <div className="flex justify-between items-center w-full">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedDish(dish)}
                      >
                        Batafsil
                      </Button>
                      <Button 
                        variant={dish.isActive ? 'secondary' : 'default'} 
                        size="sm"
                        onClick={() => handleToggleDishStatus(dish)}
                      >
                        {dish.isActive ? 'O\'chirish' : 'Faollashtirish'}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Ingredientlar Tab */}
        <TabsContent value="ingredients" className="space-y-6">
          {isLoadingIngredients ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : ingredients.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileEdit className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium mb-2">Ingredientlar topilmadi</h3>
                <p className="text-gray-500 mb-4 text-center max-w-md">
                  Hozircha yaratilgan ingredientlar mavjud emas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Mavjud ingredientlar ({ingredients.length})</h2>
              </div>
              
              <div className="rounded-md border">
                <div className="grid grid-cols-12 px-6 py-3 bg-gray-50 text-sm font-medium text-gray-500">
                  <div className="col-span-3">Nomi</div>
                  <div className="col-span-2">Birlik</div>
                  <div className="col-span-2">Narx</div>
                  <div className="col-span-2">Miqdor</div>
                  <div className="col-span-2">O'lchov</div>
                  <div className="col-span-1 text-right">Amallar</div>
                </div>
                <div className="divide-y">
                  {ingredients.map(ingredient => (
                    <div key={ingredient.id} className="grid grid-cols-12 px-6 py-4 items-center text-sm">
                      <div className="col-span-3 font-medium">{ingredient.name}</div>
                      <div className="col-span-2">{ingredient.unit}</div>
                      <div className="col-span-2">{ingredient.cost.toLocaleString()} UZS</div>
                      <div className="col-span-2">{ingredient.stockQuantity}</div>
                      <div className="col-span-2">{ingredient.unit}</div>
                      <div className="col-span-1 flex justify-end">
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Ovqatlanish Tab */}
        <TabsContent value="meal-sessions" className="space-y-6">
          {isLoadingMealSessions ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : mealSessions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium mb-2">Ovqatlanish sessiyalari topilmadi</h3>
                <p className="text-gray-500 mb-4 text-center max-w-md">
                  Hozircha yaratilgan ovqatlanish sessiyalari mavjud emas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">{formatDate(selectedDate)} uchun ovqatlanishlar</h2>
              </div>
              
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {['breakfast', 'lunch', 'dinner'].map(mealType => {
                  const session = mealSessions.find(s => s.type === mealType);
                  return (
                    <Card key={mealType}>
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <Clock className="h-5 w-5 mr-2" />
                          {renderMealTime(mealType)}
                        </CardTitle>
                        {session && (
                          <CardDescription>
                            {session.startTime} - {session.endTime}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {session ? (
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Status</span>
                              <Badge
                                variant={
                                  session.status === 'active' ? 'default' : 
                                  session.status === 'planned' ? 'outline' : 
                                  session.status === 'completed' ? 'secondary' : 'destructive'
                                }
                              >
                                {session.status === 'active' ? 'Faol' : 
                                 session.status === 'planned' ? 'Rejalashtirilgan' : 
                                 session.status === 'completed' ? 'Tugallangan' : 'Bekor qilingan'}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Kelganlar</span>
                              <span>{session.attendance} kishi</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Menyu</span>
                              <span>{session.menu.name}</span>
                            </div>
                            {session.notes && (
                              <div className="pt-2">
                                <span className="text-gray-500 block mb-1 text-sm">Eslatmalar:</span>
                                <p className="text-sm">{session.notes}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6">
                            <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
                            <p className="text-gray-500 text-center">
                              Bu turdagi ovqatlanish uchun sessiya mavjud emas
                            </p>
                          </div>
                        )}
                      </CardContent>
                      {session && (
                        <CardFooter className="border-t bg-gray-50 px-6 py-3">
                          <Button variant="ghost" size="sm" className="w-full">
                            Batafsil
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Ovoz berishlar Tab */}
        <TabsContent value="votings" className="space-y-6">
          {isLoadingVotings ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : votings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium mb-2">Ovoz berishlar topilmadi</h3>
                <p className="text-gray-500 mb-4 text-center max-w-md">
                  Hozircha yaratilgan ovoz berishlar mavjud emas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Faol ovoz berishlar ({votings.length})</h2>
              </div>
              
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {votings.map(voting => (
                  <Card key={voting.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{voting.title}</CardTitle>
                          <CardDescription>
                            {formatDate(voting.startDate)} - {formatDate(voting.endDate)}
                          </CardDescription>
                        </div>
                        <Badge variant="default">Faol</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {voting.description && (
                        <p className="text-sm text-gray-500 mb-4">{voting.description}</p>
                      )}
                      
                      <div className="space-y-3">
                        {voting.options.length === 0 ? (
                          <div className="text-center py-3 bg-gray-50 rounded-md">
                            <p className="text-gray-500">Hech qanday taom qo'shilmagan</p>
                          </div>
                        ) : (
                          voting.options.map(option => {
                            const totalVotes = voting.options.reduce((sum, o) => sum + o.votes, 0);
                            const votePercentage = totalVotes > 0 
                              ? Math.round((option.votes / totalVotes) * 100) 
                              : 0;
                            
                            return (
                              <div key={option.dishId} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium">{option.dishName}</span>
                                  <span>
                                    {option.votes} ovoz ({votePercentage}%)
                                  </span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary" 
                                    style={{ width: `${votePercentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-gray-50 px-6 py-3">
                      <div className="w-full">
                        <Button variant="ghost" size="sm" className="w-full">
                          Batafsil
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CanteenPage;