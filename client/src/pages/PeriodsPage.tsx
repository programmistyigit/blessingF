import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Filter, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PeriodService, type Period } from '@/services/PeriodService';
import PeriodForm from '@/components/forms/PeriodForm';


export default function PeriodsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Fetch periods data
  const { data, isLoading } = useQuery({
    queryKey: ['/api/periods'],
    queryFn: async () => {
      const periodsData = await PeriodService.getAllPeriods();
      console.log(periodsData, 'periodsData');
      
      return Array.isArray(periodsData) ? periodsData : [];
    }
  });

  useEffect(() => {
    console.log(data, 'periodsData');
    
  }, [data]);

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch (error) {
      return 'Noto\'g\'ri sana';
    }
  };

  // Filter periods by status
  const filteredPeriods = typeof (data) == "object" && data?.filter((period: Period) => {
    if (statusFilter === 'all') return true;
    return period.status.toLowerCase() === statusFilter.toLowerCase();
  }) || [];

  useEffect(() => {
    console.log(filteredPeriods, 'filteredPeriods');
    
  }, [filteredPeriods]);

  // Delete period mutation
  const deletePeriodMutation = useMutation({
    mutationFn: async (id: string) => {
      return await PeriodService.deletePeriod(id);
    },
    onSuccess: () => {
      setShowDeleteDialog(false);
      setSelectedPeriod(null);
      queryClient.invalidateQueries({ queryKey: ['/api/periods'] });
      toast({
        title: 'Muvaffaqiyatli o\'chirildi',
        description: 'Davr muvaffaqiyatli o\'chirildi.',
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

  // Handle delete click
  const handleDeleteClick = (period: Period) => {
    setSelectedPeriod(period);
    setShowDeleteDialog(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedPeriod) {
      deletePeriodMutation.mutate(selectedPeriod.id);
    }
  };

  // Function to determine status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Davrlar Boshqaruvi</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Barcha statuslar" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha statuslar</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="planned">Rejalashtirilgan</SelectItem>
                <SelectItem value="completed">Tugatilgan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="bg-primary text-white"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Davr qo'shish
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider">Nomi</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Kod</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Boshlanish sanasi</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Tugash sanasi</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Harakat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPeriods.map((period: Period) => (
                  <TableRow key={period.id}>
                    <TableCell className="whitespace-nowrap font-medium">{period.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{period.code}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(period.startDate)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(period.endDate)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge className={getStatusBadgeColor(period.status)} variant="outline">
                        {period.status === 'active' ? 'Faol' :
                          period.status === 'planned' ? 'Rejalashtirilgan' : 'Tugatilgan'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedPeriod(period);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={period.status === 'completed'}
                          onClick={() => {
                            setSelectedPeriod(period);
                            setShowEditForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          disabled={period.status === 'active'}
                          onClick={() => handleDeleteClick(period)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {!isLoading && filteredPeriods.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      Hech qanday davr topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Period Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yangi Davr</DialogTitle>
            <DialogDescription>
              Yangi davr ma'lumotlarini kiriting. Ushbu davr hisobotlar va tahlillar uchun ishlatiladi.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <PeriodForm onSuccess={() => setShowAddForm(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Period Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Davrni Tahrirlash</DialogTitle>
            <DialogDescription>
              Davr ma'lumotlarini tahrirlang.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            {selectedPeriod && (
              <PeriodForm
                periodToEdit={selectedPeriod}
                onSuccess={() => {
                  setShowEditForm(false);
                  setSelectedPeriod(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Period Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Davrni o'chirishni tasdiqlaysizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu harakat orqali davr tizimdan butunlay o'chiriladi va qayta tiklab bo'lmaydi.
              {selectedPeriod && (
                <span className="font-medium block mt-2">
                  Davr: {selectedPeriod.name} ({selectedPeriod.code})
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletePeriodMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deletePeriodMutation.isPending ? "O'chirilmoqda..." : "O'chirish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Davr Tafsilotlari</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPeriod && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Nomi</h3>
                    <p className="mt-1 text-base font-medium">{selectedPeriod.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Kod</h3>
                    <p className="mt-1 text-base font-medium">{selectedPeriod.code}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Boshlanish sanasi</h3>
                    <p className="mt-1 text-base">{formatDate(selectedPeriod.startDate)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tugash sanasi</h3>
                    <p className="mt-1 text-base">{formatDate(selectedPeriod.endDate)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <div className="mt-1">
                      <Badge className={getStatusBadgeColor(selectedPeriod.status)} variant="outline">
                        {selectedPeriod.status === 'active' ? 'Faol' :
                          selectedPeriod.status === 'planned' ? 'Rejalashtirilgan' : 'Tugatilgan'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Izoh</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {selectedPeriod.description || 'Izoh mavjud emas'}
                  </p>
                </div>

                <div className="flex justify-end space-x-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsDialog(false)}
                  >
                    Yopish
                  </Button>
                  {selectedPeriod.status !== 'completed' && (
                    <Button
                      className="bg-primary text-white"
                      onClick={() => {
                        setShowDetailsDialog(false);
                        setShowEditForm(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Tahrirlash
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}