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
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Employee {
  id: string;
  name: string;
  phoneNumber: string;
  role: string;
  section: {
    id: string;
    name: string;
  };
  position: {
    id: string;
    name: string;
  };
}

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  loading?: boolean;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onEdit,
  onDelete,
  loading = false
}) => {
  // Function to determine role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'boss':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'worker':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Translate role to Uzbek
  const translateRole = (role: string): string => {
    switch (role.toLowerCase()) {
      case 'boss':
        return "Bo'lim boshlig'i";
      case 'manager':
        return 'Menejer';
      case 'worker':
        return 'Ishchi';
      default:
        return role;
    }
  };

  return (
    <div className="overflow-x-auto rounded-md bg-white shadow">
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent mx-auto mb-2"></div>
          <p className="text-neutral-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-neutral-600">Hech qanday xodim topilmadi</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wider">Ismi</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Lavozim</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Telefon</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Bo'lim</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Rol</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Harakat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="whitespace-nowrap font-medium">{employee.name}</TableCell>
                <TableCell className="whitespace-nowrap">{employee.position.name}</TableCell>
                <TableCell className="whitespace-nowrap">{employee.phoneNumber}</TableCell>
                <TableCell className="whitespace-nowrap">{employee.section.name}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge className={getRoleBadgeColor(employee.role)} variant="outline">
                    {translateRole(employee.role)}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => onEdit(employee)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-700" 
                      onClick={() => onDelete(employee)}
                    >
                      <Trash2 className="h-4 w-4" />
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

export default EmployeeTable;
