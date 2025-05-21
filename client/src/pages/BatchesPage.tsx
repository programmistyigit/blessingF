import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  createBatch, 
  getBatches,
  updateBatch,
  deleteBatch
} from '@/lib/api';
import { getUser } from '@/lib/auth';
import BatchForm from '@/components/forms/BatchForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Pencil, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface Batch {
  id: string;
  batchNumber: string;
  section: {
    id: string;
    name: string;
  };
  arrivalDate: string;
  initialCount: number;
  currentCount: number;
  breed: string;
  supplier: string;
  status: string;
}

interface DetailedBatch extends Batch {
  period: {
    id: string;
    name: string;
  };
  acceptableMortalityRate: number;
  acceptableGrowthVariance: number;
  notes?: string;
  notificationPhoneNumbers: string[];
}

const BatchesPage: React.FC = () => {
  const user = getUser();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<DetailedBatch | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Fetch batches data
  const { data: batchesData, isLoading: isLoadingBatches } = useQuery({
    queryKey: ['/api/batches', statusFilter !== 'all' ? { status: statusFilter } : undefined],
    enabled: !!user,
  });
  
  // Fetch sections data
  const { data: sectionsData, isLoading: isLoadingSections } = useQuery({
    queryKey: ['/api/sections'],
    enabled: !!user,
  });
  
  useEffect(() => {console.log('Sections Data:', sectionsData);}, [sectionsData]);
  // Fetch periods data
  const { data: periodsData, isLoading: isLoadingPeriods } = useQuery({
    queryKey: ['/api/periods'],
    enabled: !!user,
  });
  
  // Use API data if available, otherwise use empty arrays
  const batches: DetailedBatch[] = (batchesData && typeof batchesData === 'object' && 'batches' in batchesData && Array.isArray((batchesData as any).batches))
    ? (batchesData as { batches: DetailedBatch[] }).batches
    : [];
  const sections = sectionsData as {data: {id: string; name: string}[]}; ;
  const periods = (periodsData as any[] | undefined) || [];
  
  // Filter batches by status (API already does this, but we keep the logic for clarity)
  const filteredBatches = batches;

  // Add batch mutation
  const addBatchMutation = useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      toast({
        title: 'Muvaffaqiyatli qo\'shildi',
        description: 'Yangi tovuq partiyasi ma\'lumotlari saqlandi.',
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

  // Handle add batch form submission
  const handleAddBatch = (data: any) => {
    addBatchMutation.mutate(data);
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
      case 'ready':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle view details click
  const handleViewDetails = (batch: DetailedBatch) => {
    setSelectedBatch(batch);
    setShowDetailsDialog(true);
  };

  // Handle delete click
  const handleDeleteClick = (batch: DetailedBatch) => {
    setSelectedBatch(batch);
    setShowDeleteDialog(true);
  };

  // Delete batch mutation
  const deleteBatchMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteBatch(id);
    },
    onSuccess: () => {
      setShowDeleteDialog(false);
      setSelectedBatch(null);
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
      toast({
        title: 'Muvaffaqiyatli o\'chirildi',
        description: 'Partiya muvaffaqiyatli o\'chirildi.',
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

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedBatch) {
      deleteBatchMutation.mutate(selectedBatch.id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tovuq Partiyalari</h1>
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
                <SelectItem value="ready">Tayyor</SelectItem>
                <SelectItem value="completed">Tugatilgan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            className="bg-primary text-white"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Partiya qo'shish
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-0">
          {isLoadingBatches ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider">Partiya #</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Bo'lim</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Sana</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Miqdori</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Zot</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Harakat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(filteredBatches) && filteredBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="whitespace-nowrap font-medium">{batch.batchNumber}</TableCell>
                    <TableCell className="whitespace-nowrap">{batch.section.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(batch.arrivalDate)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {batch.currentCount} / {batch.initialCount}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{batch.breed}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge className={getStatusBadgeColor(batch.status)} variant="outline">
                        {batch.status === 'active' ? 'Faol' : 
                        batch.status === 'planned' ? 'Rejalashtirilgan' : 
                        batch.status === 'ready' ? 'Tayyor' : 'Tugatilgan'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => handleViewDetails(batch)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8" 
                          disabled={batch.status === 'completed'}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-700" 
                          disabled={batch.status === 'active' || batch.status === 'completed'}
                          onClick={() => handleDeleteClick(batch)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {!isLoadingBatches && filteredBatches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      Hech qanday partiya topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Add Batch Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yangi Tovuq Partiyasi</DialogTitle>
            <DialogDescription>
              Yangi tovuq partiyasi ma'lumotlarini kiriting. Ushbu partiya sizning bo'limingizga tegishli bo'ladi.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <BatchForm 
              sections={sections?.data ? sections.data : []}
              periods={periods}
              onSubmit={handleAddBatch}
              isSubmitting={addBatchMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Batch Details Dialog */}
      {selectedBatch && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Partiya Ma'lumotlari: {selectedBatch.batchNumber}</DialogTitle>
              <DialogDescription>
                Partiya batafsil ma'lumotlari
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto pr-2">
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Asosiy Ma'lumotlar</TabsTrigger>
                  <TabsTrigger value="stats">Statistika</TabsTrigger>
                  <TabsTrigger value="settings">Sozlamalar</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Partiya raqami</h3>
                      <p>{selectedBatch.batchNumber}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Bo'lim</h3>
                      <p>{selectedBatch.section.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Davri</h3>
                      <p>{selectedBatch.period.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Kelish sanasi</h3>
                      <p>{formatDate(selectedBatch.arrivalDate)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Dastlabki miqdor</h3>
                      <p>{selectedBatch.initialCount} ta</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Joriy miqdor</h3>
                      <p>{selectedBatch.currentCount} ta</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Zot</h3>
                      <p>{selectedBatch.breed}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Ta'minotchi</h3>
                      <p>{selectedBatch.supplier}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <Badge className={getStatusBadgeColor(selectedBatch.status)} variant="outline">
                        {selectedBatch.status === 'active' ? 'Faol' : 
                         selectedBatch.status === 'planned' ? 'Rejalashtirilgan' : 
                         selectedBatch.status === 'ready' ? 'Tayyor' : 'Tugatilgan'}
                      </Badge>
                    </div>
                  </div>
                  {selectedBatch.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Eslatmalar</h3>
                      <p>{selectedBatch.notes}</p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="stats" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Joriy o'lim</p>
                          <p className="text-2xl font-bold">
                            {((selectedBatch.initialCount - selectedBatch.currentCount) / selectedBatch.initialCount * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-400">
                            {selectedBatch.initialCount - selectedBatch.currentCount} ta
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Maqbul o'lim</p>
                          <p className="text-2xl font-bold">
                            {selectedBatch.acceptableMortalityRate}%
                          </p>
                          <p className="text-xs text-gray-400">
                            {Math.round(selectedBatch.initialCount * selectedBatch.acceptableMortalityRate / 100)} ta
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Kundalik o'sish</p>
                          <p className="text-2xl font-bold">0.35 kg</p>
                          <p className="text-xs text-gray-400">
                            O'rta ko'rsatkich
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">O'lim dinamikasi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 flex items-center justify-center bg-gray-100 rounded-md">
                        <p className="text-gray-500">Bu yerda o'lim dinamikasi grafigi bo'ladi</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="settings" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Xabarnoma sozlamalari</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Xabarnoma telefon raqamlari</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedBatch.notificationPhoneNumbers.map((phone, index) => (
                              <Badge key={index} variant="secondary">
                                {phone}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Maqbul o'lim ko'rsatkichi</h3>
                          <p>{selectedBatch.acceptableMortalityRate}%</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Maqbul o'sish variansiyasi</h3>
                          <p>{selectedBatch.acceptableGrowthVariance}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Partiyani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedBatch?.batchNumber} partiyasini o'chirishni xohlaysizmi? Bu amaliyot qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteConfirm}
              disabled={deleteBatchMutation.isPending}
            >
              {deleteBatchMutation.isPending ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Jarayonda...
                </span>
              ) : 'O\'chirish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BatchesPage;
