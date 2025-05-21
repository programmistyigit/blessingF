import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ShoppingCart, PenIcon } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentQuantity: number;
  minimumQuantity: number;
  location?: string;
}

interface InventoryTableProps {
  items: InventoryItem[];
  onOrder: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  loading?: boolean;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  onOrder,
  onEdit,
  loading = false
}) => {
  // Calculate stock level as a percentage
  const calculateStockLevel = (current: number, minimum: number): number => {
    if (minimum === 0) return 100;
    
    // If we're at or below the minimum, calculate percentage based on minimum
    if (current <= minimum) {
      return (current / minimum) * 30; // Max 30% when at minimum
    }
    
    // If we're above minimum, use a scale from 30% to 100%
    const extraStock = current - minimum;
    const extraPercentage = Math.min(70, (extraStock / minimum) * 70);
    return 30 + extraPercentage;
  };

  // Get stock level color
  const getStockLevelColor = (current: number, minimum: number): string => {
    if (current <= minimum * 0.1) return 'bg-red-500';
    if (current <= minimum * 0.5) return 'bg-red-400';
    if (current <= minimum) return 'bg-yellow-400';
    if (current <= minimum * 1.5) return 'bg-green-400';
    return 'bg-green-500';
  };

  // Format text for stock level
  const formatStockText = (current: number, minimum: number): string => {
    const percentage = Math.round((current / minimum) * 100);
    return `${percentage}%`;
  };

  return (
    <div className="overflow-x-auto rounded-md bg-white shadow">
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent mx-auto mb-2"></div>
          <p className="text-neutral-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-neutral-600">Hech qanday inventar topilmadi</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wider">Nomi</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Kategoriya</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Miqdori</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Minimum</TableHead>
              <TableHead className="text-xs uppercase tracking-wider w-1/4">Holati</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Harakat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-nowrap font-medium">{item.name}</TableCell>
                <TableCell className="whitespace-nowrap">{item.category}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {item.currentQuantity} {item.unit}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {item.minimumQuantity} {item.unit}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="w-full mr-2">
                      <Progress 
                        value={calculateStockLevel(item.currentQuantity, item.minimumQuantity)} 
                        className="h-2"
                        indicatorClassName={getStockLevelColor(item.currentQuantity, item.minimumQuantity)}
                      />
                    </div>
                    <span className="text-xs">
                      {formatStockText(item.currentQuantity, item.minimumQuantity)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8"
                      onClick={() => onEdit(item)}
                    >
                      <PenIcon className="h-4 w-4 mr-1" />
                      O'zgartirish
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-8 bg-primary text-white"
                      onClick={() => onOrder(item)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Buyurtma
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default InventoryTable;
