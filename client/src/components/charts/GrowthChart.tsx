import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GrowthDataPoint {
  date: string;
  weight: number;
  mortality: number;
  feed: number;
}

interface GrowthChartProps {
  data: GrowthDataPoint[];
  title: string;
  batches: { id: string; name: string }[];
  onBatchChange: (batchId: string) => void;
  selectedBatchId: string;
  loading?: boolean;
}

const GrowthChart: React.FC<GrowthChartProps> = ({
  data,
  title,
  batches,
  onBatchChange,
  selectedBatchId,
  loading = false
}) => {
  const averageWeight = data.length > 0 
    ? (data.reduce((sum, item) => sum + item.weight, 0) / data.length).toFixed(2)
    : '0.00';
    
  const mortalityRate = data.length > 0 
    ? (data.reduce((sum, item) => sum + item.mortality, 0) / data.length).toFixed(2)
    : '0.00';
    
  const feedConsumption = data.length > 0 
    ? Math.round(data.reduce((sum, item) => sum + item.feed, 0) / data.length)
    : 0;
  
  return (
    <Card>
      <CardHeader className="border-b border-neutral-200 px-6 py-4 flex flex-row justify-between items-center">
        <CardTitle className="font-heading font-semibold text-neutral-800">{title}</CardTitle>
        <Select value={selectedBatchId} onValueChange={onBatchChange}>
          <SelectTrigger className="w-[180px] bg-neutral-100 border border-neutral-300">
            <SelectValue placeholder="Partiyani tanlang" />
          </SelectTrigger>
          <SelectContent>
            {batches.map((batch) => (
              <SelectItem key={batch.id} value={batch.id}>
                {batch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <p className="text-neutral-600 mb-2">Ma'lumotlar yuklanmoqda...</p>
              <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent mx-auto"></div>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-neutral-600">Bu partiya uchun ma'lumotlar topilmadi</p>
          </div>
        ) : (
          <>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="weight" 
                    name="O'rtacha og'irlik (kg)" 
                    stroke="#0056b3" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="mortality" 
                    name="O'lim (%)" 
                    stroke="#dc3545" 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="feed" 
                    name="Yem (kg)" 
                    stroke="#28a745" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-center space-x-10 pt-4 mt-4 border-t border-neutral-200">
              <div className="text-center">
                <div className="text-primary font-bold text-xl">{averageWeight} kg</div>
                <div className="text-neutral-500 text-sm">O'rtacha o'sish</div>
              </div>
              <div className="text-center">
                <div className="text-danger font-bold text-xl">{mortalityRate}%</div>
                <div className="text-neutral-500 text-sm">O'lim ko'rsatkichi</div>
              </div>
              <div className="text-center">
                <div className="text-secondary font-bold text-xl">{feedConsumption} kg</div>
                <div className="text-neutral-500 text-sm">Kunlik yem sarfi</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GrowthChart;
