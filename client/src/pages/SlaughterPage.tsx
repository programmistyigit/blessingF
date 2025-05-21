import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  createSlaughterBatch, 
  getSlaughterBatches, 
  updateSlaughterBatch, 
  deleteSlaughterBatch,
  getBatches
} from '@/lib/api';
import { getUser } from '@/lib/auth';
import SlaughterForm from '@/components/forms/SlaughterForm';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Pencil, Trash2, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { useLocation } from 'wouter';
import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface SlaughterBatch {
  id: string;
  batchNumber: string;
  chickenBatch: string;
  chickenBatchDetails?: {
    batchNumber: string;
    breed: string;
  };
  section: {
    id: string;
    name: string;
  };
  plannedDate: string;
  actualDate?: string;
  preslaughterCount: number;
  preslaughterAverageWeight: number;
  postslaughterCount?: number;
  postslaughterAverageWeight?: number;
  processingTeam: string[];
  status: string;
  notes?: string;
}

interface Batch {
  id: string;
  batchNumber: string;
  currentCount: number;
  breed: string;
}

interface Employee {
  id: string;
  name: string;
}

const SlaughterPage: React.FC = () => {
  const user = getUser();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<SlaughterBatch | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Fetch slaughter batches data
  const { data: slaughterBatchesData, isLoading: isLoadingSlaughterBatches } = useQuery({
    queryKey: ['/api/slaughter-batches', statusFilter !== 'all' ? { status: statusFilter } : undefined],
    enabled: !!user,
  });
  
  // Fetch available chicken batches for dropdown
  const { data: availableBatchesData, isLoading: isLoadingBatches } = useQuery({
    queryKey: ['/api/batches', { status: 'ready_for_slaughter' }],
    enabled: !!user,
  });
  
  // Fetch employees data for team selection
  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['/api/user', { role: 'worker' }],
    enabled: !!user,
  });
  
  // Fetch sections data
  const { data: sectionsData, isLoading: isLoadingSections } = useQuery({
    queryKey: ['/api/sections'],
    enabled: !!user,
  });
  
  // Use API data if available, otherwise use empty arrays
  const slaughterBatches: SlaughterBatch[] = (slaughterBatchesData as SlaughterBatch[] | undefined) || [];
  const availableBatches: Batch[] = (availableBatchesData as Batch[] | undefined) || [];
  const employees: Employee[] = (employeesData as Employee[] | undefined) || [];
  const sections = (sectionsData as any[] | undefined) || [];
  
  // Check if URL has a batch parameter for auto-creating slaughter plan
  useEffect(() => {
    if (!availableBatches.length) return; // Wait until batches are loaded
    
    const params = new URLSearchParams(location.split('?')[1]);
    const batchId = params.get('batchId');
    
    if (batchId) {
      // Find the batch in the available batches from API
      const batch = availableBatches.find(b => b.id === batchId);
      if (batch) {
        setShowAddForm(true);
        // Clear the URL parameter
        setLocation('/slaughter', { replace: true });
      }
    }
  }, [location, setLocation, availableBatches]);
  
  // Filter batches by status (API already does this, but we keep the logic for clarity)
  const filteredBatches = slaughterBatches;

  // Add slaughter batch mutation
  const addSlaughterBatchMutation = useMutation({
    mutationFn: createSlaughterBatch,
    onSuccess: () => {
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/slaughter-batches'] });
      toast({
        title: 'Muvaffaqiyatli qo\'shildi',
        description: 'Yangi so\'yish partiyasi ma\'lumotlari saqlandi.',
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

  // Handle add slaughter batch form submission
  const handleAddSlaughterBatch = (data: any) => {
    addSlaughterBatchMutation.mutate(data);
  };

  // Function to determine status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Translate status to Uzbek
  const translateStatus = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'planned':
        return 'Rejalashtirilgan';
      case 'in_progress':
        return 'Jarayonda';
      case 'completed':
        return 'Tugatilgan';
      default:
        return status;
    }
  };

  // Handle complete button click
  const handleCompleteClick = (batch: SlaughterBatch) => {
    setSelectedBatch(batch);
    setShowCompleteDialog(true);
  };

  // Handle delete button click
  const handleDeleteClick = (batch: SlaughterBatch) => {
    setSelectedBatch(batch);
    setShowDeleteDialog(true);
  };

  // Complete slaughter batch mutation
  const completeSlaughterBatchMutation = useMutation({
    mutationFn: (data: any) => {
      if (!selectedBatch) throw new Error('No batch selected');
      return updateSlaughterBatch(selectedBatch.id, {
        ...selectedBatch,
        ...data,
        status: 'completed',
        actualDate: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setShowCompleteDialog(false);
      setSelectedBatch(null);
      queryClient.invalidateQueries({ queryKey: ['/api/slaughter-batches'] });
      toast({
        title: 'Muvaffaqiyatli tugatildi',
        description: 'So\'yish partiyasi muvaffaqiyatli tugatildi.',
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

  // State to track form data for complete dialog
  const [completeFormData, setCompleteFormData] = useState({
    postslaughterCount: 0,
    postslaughterAverageWeight: 0,
    notes: ''
  });

  // Update form state when input changes
  const handleCompleteFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompleteFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Initialize form data when dialog opens
  useEffect(() => {
    if (selectedBatch && showCompleteDialog) {
      setCompleteFormData({
        postslaughterCount: selectedBatch.preslaughterCount,
        postslaughterAverageWeight: selectedBatch.preslaughterAverageWeight,
        notes: selectedBatch.notes || ''
      });
    }
  }, [selectedBatch, showCompleteDialog]);

  // Complete slaughter batch
  const handleCompleteSubmit = () => {
    completeSlaughterBatchMutation.mutate(completeFormData);
  };

  // Delete slaughter batch mutation
  const deleteSlaughterBatchMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteSlaughterBatch(id);
    },
    onSuccess: () => {
      setShowDeleteDialog(false);
      setSelectedBatch(null);
      queryClient.invalidateQueries({ queryKey: ['/api/slaughter-batches'] });
      toast({
        title: 'Muvaffaqiyatli o\'chirildi',
        description: 'So\'yish partiyasi muvaffaqiyatli o\'chirildi.',
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

  // Delete slaughter batch
  const handleDeleteConfirm = () => {
    if (selectedBatch) {
      deleteSlaughterBatchMutation.mutate(selectedBatch.id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">So'yish Boshqaruvi</h1>
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
                <SelectItem value="planned">Rejalashtirilgan</SelectItem>
                <SelectItem value="in_progress">Jarayonda</SelectItem>
                <SelectItem value="completed">Tugatilgan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            className="bg-primary text-white"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> So'yish rejasi
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider">So'yish #</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Tovuq partiyasi</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Sana</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Miqdori</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">O'rtacha vazn</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Harakat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.length && filteredBatches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="whitespace-nowrap font-medium">{batch.batchNumber}</TableCell>
                  <TableCell className="whitespace-nowrap">{batch.chickenBatchDetails?.batchNumber}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(batch.actualDate || batch.plannedDate)}
                    {!batch.actualDate && batch.status !== 'completed' && (
                      <span className="text-xs text-gray-500 ml-1">(reja)</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {batch.status === 'completed' ? batch.postslaughterCount : batch.preslaughterCount} ta
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {batch.status === 'completed' ? batch.postslaughterAverageWeight : batch.preslaughterAverageWeight} kg
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge className={getStatusBadgeColor(batch.status)} variant="outline">
                      {translateStatus(batch.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex space-x-2">
                      {batch.status === 'planned' && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 text-green-500 hover:text-green-700" 
                          onClick={() => handleCompleteClick(batch)}
                        >
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                      )}
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
                        disabled={batch.status === 'completed'}
                        onClick={() => handleDeleteClick(batch)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredBatches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    Hech qanday so'yish partiyasi topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Add Slaughter Batch Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yangi So'yish Partiyasi</DialogTitle>
            <DialogDescription>
              Yangi so'yish partiyasi ma'lumotlarini kiriting. Ushbu partiya tovuq partiyalaridan birini so'yish uchun ishlatiladi.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <SlaughterForm 
              batches={availableBatches}
              sections={sections}
              employees={employees}
              onSubmit={handleAddSlaughterBatch}
              isSubmitting={addSlaughterBatchMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Complete Slaughter Batch Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>So'yish Partiyasini Tugatish</DialogTitle>
            <DialogDescription>
              {selectedBatch?.batchNumber} partiyasini tugatish uchun so'yishdan keyingi ma'lumotlarni kiriting.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">So'yishdan keyingi miqdor</label>
                  <input
                    name="postslaughterCount"
                    type="number"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={completeFormData.postslaughterCount}
                    onChange={handleCompleteFormChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">So'yishdan keyingi o'rtacha vazn (kg)</label>
                  <input
                    name="postslaughterAverageWeight"
                    type="number"
                    step="0.1"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={completeFormData.postslaughterAverageWeight}
                    onChange={handleCompleteFormChange}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Eslatmalar</label>
                  <textarea
                    name="notes"
                    className="w-full p-2 border border-gray-300 rounded"
                    rows={3}
                    value={completeFormData.notes}
                    onChange={handleCompleteFormChange}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => setShowCompleteDialog(false)}>
                  Bekor qilish
                </Button>
                <Button 
                  type="button" 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleCompleteSubmit}
                >
                  Tugatish
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>So'yish partiyasini o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedBatch?.batchNumber} partiyasini o'chirishni xohlaysizmi? Bu amaliyot qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteConfirm}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SlaughterPage;