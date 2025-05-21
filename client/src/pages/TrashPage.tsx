import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Trash2, RefreshCw, ArrowLeft, Filter, Search, MoreVertical, Trash, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  TrashService, 
  TrashItemType, 
  TrashItem, 
  TrashTypeStat,
  TrashTypeGroup 
} from '@/services/TrashService';

export default function TrashPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<TrashItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null);
  const itemsPerPage = 10;

  // Barcha o'chirilgan ma'lumotlarni olish
  const {
    data: statsData,
    isLoading: isStatsLoading,
  } = useQuery({
    queryKey: ['/api/trash/stats'],
    queryFn: async () => {
      const response = await TrashService.getTrashStats();
      return response.data;
    },
  });

  // Tanlangan turdagi o'chirilgan ma'lumotlarni olish
  const {
    data: typeData,
    isLoading: isTypeLoading,
    refetch: refetchTypeData,
  } = useQuery({
    queryKey: ['/api/trash', selectedType],
    queryFn: async () => {
      if (selectedType === 'all') {
        const response = await TrashService.getAllTrashItems();
        return response.data;
      } else {
        const response = await TrashService.getTrashItemsByType(selectedType as TrashItemType);
        return response.data;
      }
    },
  });

  // Tiklash uchun mutatsiya
  const restoreMutation = useMutation({
    mutationFn: async ({ type, id }: { type: TrashItemType; id: string }) => {
      return await TrashService.restoreTrashItem(type, id);
    },
    onSuccess: () => {
      toast({
        title: 'Muvaffaqiyatli tiklandi',
        description: 'Ma\'lumot muvaffaqiyatli tiklandi',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trash'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trash/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trash', selectedType] });
      setShowRestoreDialog(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast({
        title: 'Xatolik',
        description: error.toString(),
        variant: 'destructive',
      });
    },
  });

  // Formatlash funksiyalari
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
    } catch (error) {
      return 'Noto\'g\'ri sana';
    }
  };

  // Tiklash funksiyasi
  const handleRestore = (type: TrashItemType, item: TrashItem) => {
    setSelectedItem(item);
    setShowRestoreDialog(true);
  };

  // Tiklashni tasdiqlash
  const confirmRestore = () => {
    if (selectedItem && selectedType !== 'all') {
      restoreMutation.mutate({
        type: selectedType as TrashItemType,
        id: selectedItem._id,
      });
    }
  };

  // Filtrlangan ma'lumotlar
  const getFilteredItems = (): TrashItem[] => {
    if (!typeData) return [];

    if (selectedType === 'all') {
      // Umumiy ko'rinishda barcha elementlarni birlashtiramiz
      let allItems: TrashItem[] = [];
      Object.entries(typeData as Record<string, TrashTypeGroup | undefined>).forEach(([type, group]) => {
        if (group && group.items) {
          allItems = [...allItems, ...group.items.map((item: TrashItem) => ({
            ...item,
            _type: type // Tur ma'lumotini qo'shamiz
          }))];
        }
      });
      
      // Qidiruv va sahifalash
      return allItems
        .filter((item: TrashItem) => 
          (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    } else {
      // Ma'lum turdagi elementlarni qaytaramiz
      const items = (typeData as { items?: TrashItem[] }).items || [];
      
      // Qidiruv va sahifalash
      return items
        .filter((item: TrashItem) => 
          (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }
  };

  // Umumiy elementlar soni
  const getTotalItems = (): number => {
    if (!typeData) return 0;

    if (selectedType === 'all') {
      let count = 0;
      Object.values(typeData as Record<string, TrashTypeGroup | undefined>).forEach((group) => {
        if (group && group.count) {
          count += group.count;
        }
      });
      return count;
    } else {
      return (typeData as { items?: TrashItem[] }).items ? (typeData as { items?: TrashItem[] }).items!.length : 0;
    }
  };

  // Sahifalar soni
  const totalPages = Math.ceil(getTotalItems() / itemsPerPage);

  // Elementning ismini olish
  const getItemName = (item: TrashItem): string => {
    return item.name || item.title || item.code || item._id;
  };

  // Elementning turini o'qish uchun
  const getTypeDisplayName = (type: string): string => {
    return TrashService.getTypeDisplayName(type as TrashItemType);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">O'chirilgan ma'lumotlar</h1>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => refetchTypeData()}
            disabled={isTypeLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Yangilash
          </Button>
        </div>
      </div>

      {/* Statistika kartlari */}
      {!isStatsLoading && statsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsData
            .filter(stat => stat.count > 0)
            .slice(0, 4)
            .map((stat) => (
              <Card key={stat.type} className="hover:shadow-md transition-shadow">
                <CardHeader className="py-4">
                  <CardTitle className="text-sm font-medium text-gray-500">{stat.displayName}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 pt-0">
                  <div className="flex justify-between items-center">
                    <div className="text-2xl font-bold">{stat.count}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedType(stat.type)}
                    >
                      <History className="h-4 w-4 mr-2" /> Ko'rish
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Asosiy panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 mb-2">
            <CardTitle>
              {selectedType === 'all' 
                ? 'Barcha o\'chirilgan ma\'lumotlar' 
                : `${getTypeDisplayName(selectedType)} - o'chirilgan ma'lumotlar`}
            </CardTitle>
            
            <div className="flex space-x-2">
              {selectedType !== 'all' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedType('all')}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Barchasi
                </Button>
              )}

              <Select value={selectedType} onValueChange={(value) => {
                setSelectedType(value as TrashItemType | 'all');
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tur bo'yicha filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha turlar</SelectItem>
                  {statsData && statsData.map((stat) => (
                    <SelectItem key={stat.type} value={stat.type}>
                      {stat.displayName} ({stat.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nomini qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {isTypeLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Nomi</TableHead>
                    {selectedType === 'all' && <TableHead>Tur</TableHead>}
                    <TableHead>O'chirilgan sana</TableHead>
                    <TableHead>O'chirgan foydalanuvchi</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredItems().map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">
                        {getItemName(item)}
                      </TableCell>
                      {selectedType === 'all' && (
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-100">
                            {getTypeDisplayName(item._type as string)}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell>{formatDate(item.deletedAt)}</TableCell>
                      <TableCell>
                        {typeof item.deletedBy === 'object' 
                          ? item.deletedBy.name 
                          : 'Noma\'lum foydalanuvchi'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestore(
                            selectedType === 'all' 
                              ? (item._type as TrashItemType)
                              : (selectedType as TrashItemType),
                            item
                          )}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {getFilteredItems().length === 0 && (
                    <TableRow>
                      <TableCell 
                        colSpan={selectedType === 'all' ? 5 : 4} 
                        className="text-center py-6 text-muted-foreground"
                      >
                        O'chirilgan ma'lumotlar topilmadi
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Sahifalash */}
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                            }
                          }}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => (
                        <PaginationItem key={i + 1}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === i + 1}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(i + 1);
                            }}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                            }
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Tiklash dialog */}
      {selectedItem && (
        <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ma'lumotni tiklash</DialogTitle>
              <DialogDescription>
                Ushbu ma'lumotni tizimga qaytarmoqchimisiz? Bu amal ma'lumotni o'chirilganlar ro'yxatidan olib tashlab, yana faol holatga qaytaradi.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3">
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">Nomi:</span> {getItemName(selectedItem)}
                </div>
                <div>
                  <span className="font-semibold">Turi:</span> {
                    selectedType === 'all' 
                      ? getTypeDisplayName(selectedItem._type as string) 
                      : getTypeDisplayName(selectedType as string)
                  }
                </div>
                <div>
                  <span className="font-semibold">O'chirilgan sana:</span> {formatDate(selectedItem.deletedAt)}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRestoreDialog(false)}
              >
                Bekor qilish
              </Button>
              <Button
                onClick={confirmRestore}
                disabled={restoreMutation.isPending}
              >
                {restoreMutation.isPending ? 'Tiklanmoqda...' : 'Tiklash'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}