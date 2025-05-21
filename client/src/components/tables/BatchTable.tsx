import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export interface Batch {
  id: string;
  batchNumber: string;
  section: {
    id: string;
    name: string;
  };
  arrivalDate: string;
  currentCount: number;
  initialCount: number;
  breed: string;
  status: string;
  preslaughterAverageWeight: number;
}

interface BatchTableProps {
  batches: Batch[];
  title: string;
  actionLabel?: string;
  onAction?: (batch: Batch) => void;
  loading?: boolean;
}

const BatchTable: React.FC<BatchTableProps> = ({
  batches,
  title,
  actionLabel = "Rejalashtirish",
  onAction,
  loading = false
}) => {
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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-neutral-200 px-6 py-4">
        <h2 className="font-heading font-semibold text-neutral-800">{title}</h2>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="py-10 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent mx-auto mb-2"></div>
            <p className="text-neutral-600">Ma'lumotlar yuklanmoqda...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-neutral-600">Hech qanday partiya topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider">Partiya</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Sana</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Soni</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">O'rtacha og'irlik</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                  {onAction && (
                    <TableHead className="text-xs uppercase tracking-wider">Harakat</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="whitespace-nowrap">{batch.batchNumber}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(batch.arrivalDate)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {batch.currentCount} / {batch.initialCount}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {`${batch.preslaughterAverageWeight.toFixed(1)} kg`}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge className={getStatusBadgeColor(batch.status)} variant="outline">
                        {batch.status}
                      </Badge>
                    </TableCell>
                    {onAction && (
                      <TableCell className="whitespace-nowrap">
                        <Button
                          className="bg-primary text-white text-xs py-1 px-3 rounded hover:bg-primary-dark"
                          onClick={() => onAction(batch)}
                          size="sm"
                        >
                          {actionLabel}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchTable;
