"use client";

import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  DollarSign 
} from 'lucide-react';

// Optimized Financial Summary Component
interface FinancialSummaryProps {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  period: string;
}

export const OptimizedFinancialSummary = memo<FinancialSummaryProps>(({
  totalRevenue,
  totalCosts,
  netProfit,
  profitMargin,
  period
}) => {
  // Memoize expensive calculations
  const profitStatus = useMemo(() => {
    if (netProfit > 0) return { 
      icon: TrendingUp, 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      label: 'Profitable' 
    };
    if (netProfit < 0) return { 
      icon: TrendingDown, 
      color: 'text-red-600', 
      bg: 'bg-red-50',
      label: 'Loss' 
    };
    return { 
      icon: BarChart3, 
      color: 'text-gray-600', 
      bg: 'bg-gray-50',
      label: 'Break-even' 
    };
  }, [netProfit]);

  const formatCurrency = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return {
      revenue: formatter.format(totalRevenue),
      costs: formatter.format(totalCosts),
      profit: formatter.format(netProfit)
    };
  }, [totalRevenue, totalCosts, netProfit]);

  const profitabilityLevel = useMemo(() => {
    if (profitMargin > 20) return 'Excellent';
    if (profitMargin > 10) return 'Good';
    if (profitMargin > 0) return 'Moderate';
    return 'Poor';
  }, [profitMargin]);

  const ProfitIcon = profitStatus.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency.revenue}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Costs</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency.costs}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${profitStatus.bg} flex items-center justify-center`}>
              <ProfitIcon className={`h-5 w-5 ${profitStatus.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className={`text-lg font-bold ${profitStatus.color}`}>
                {formatCurrency.profit}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${profitStatus.bg} flex items-center justify-center`}>
              <PieChart className={`h-5 w-5 ${profitStatus.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Margin</p>
              <div className="flex items-center gap-2">
                <p className={`text-lg font-bold ${profitStatus.color}`}>
                  {profitMargin.toFixed(1)}%
                </p>
                <Badge variant="outline" className="text-xs">
                  {profitabilityLevel}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

OptimizedFinancialSummary.displayName = 'OptimizedFinancialSummary';

// Optimized Data Table Component
interface DataItem {
  id: string;
  name: string;
  value: number;
  category: string;
  date: string;
}

interface OptimizedDataTableProps {
  data: DataItem[];
  onItemClick?: (item: DataItem) => void;
  sortBy?: 'name' | 'value' | 'date';
  filterCategory?: string;
}

export const OptimizedDataTable = memo<OptimizedDataTableProps>(({
  data,
  onItemClick,
  sortBy = 'name',
  filterCategory
}) => {
  // Memoize filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = data;
    
    // Apply category filter
    if (filterCategory) {
      filtered = filtered.filter(item => item.category === filterCategory);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return b.value - a.value;
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return sorted;
  }, [data, sortBy, filterCategory]);

  // Memoize click handlers
  const handleItemClick = useCallback((item: DataItem) => {
    onItemClick?.(item);
  }, [onItemClick]);

  const formatValue = useCallback((value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(value);
  }, []);

  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  // Memoize row components
  const TableRow = memo<{ item: DataItem }>(({ item }) => (
    <tr 
      key={item.id}
      onClick={() => handleItemClick(item)}
      className="hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <td className="px-4 py-2 font-medium">{item.name}</td>
      <td className="px-4 py-2">{formatValue(item.value)}</td>
      <td className="px-4 py-2">
        <Badge variant="outline" className="text-xs">
          {item.category}
        </Badge>
      </td>
      <td className="px-4 py-2 text-muted-foreground text-sm">
        {formatDate(item.date)}
      </td>
    </tr>
  ));

  TableRow.displayName = 'TableRow';

  if (processedData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Summary</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{processedData.length} items</span>
          {filterCategory && (
            <Badge variant="secondary">{filterCategory}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left font-medium">Name</th>
                <th className="px-4 py-2 text-left font-medium">Value</th>
                <th className="px-4 py-2 text-left font-medium">Category</th>
                <th className="px-4 py-2 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {processedData.map(item => (
                <TableRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedDataTable.displayName = 'OptimizedDataTable';

// Optimized Chart Container with dynamic loading
interface OptimizedChartContainerProps {
  title: string;
  data: any[];
  chartType: 'line' | 'bar' | 'pie';
  height?: number;
  showLegend?: boolean;
}

export const OptimizedChartContainer = memo<OptimizedChartContainerProps>(({
  title,
  data,
  chartType,
  height = 300,
  showLegend = true
}) => {
  // Only process chart data when it actually changes
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedValue: typeof item.value === 'number' 
        ? item.value.toLocaleString('en-IN')
        : item.value
    }));
  }, [data]);

  const isEmpty = useMemo(() => {
    return !data || data.length === 0;
  }, [data]);

  if (isEmpty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg"
            style={{ height }}
          >
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-muted-foreground">No data to display</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {chartType.toUpperCase()}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {chartData.length} data points
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="border rounded-lg bg-gray-50 flex items-center justify-center"
          style={{ height }}
        >
          <div className="text-center p-8">
            <BarChart3 className="h-16 w-16 mx-auto text-primary mb-4" />
            <h3 className="font-medium mb-2">{chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Displaying {chartData.length} data points
            </p>
            <div className="space-y-2">
              {chartData.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{item.name || `Item ${index + 1}`}:</span>
                  <span className="font-medium">{item.formattedValue}</span>
                </div>
              ))}
              {chartData.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{chartData.length - 5} more items
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedChartContainer.displayName = 'OptimizedChartContainer';