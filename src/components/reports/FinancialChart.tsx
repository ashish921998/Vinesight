"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  PieChart,
  BarChart3
} from 'lucide-react';
import { CostCategory, RevenueSource } from '@/lib/reporting-types';

interface FinancialChartProps {
  costBreakdown: CostCategory[];
  revenueBreakdown: RevenueSource[];
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
}

export function FinancialChart({
  costBreakdown,
  revenueBreakdown,
  totalRevenue,
  totalCosts,
  netProfit,
  profitMargin
}: FinancialChartProps) {
  const profitStatus = useMemo(() => {
    if (netProfit > 0) return { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' };
    if (netProfit < 0) return { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' };
    return { icon: Minus, color: 'text-gray-600', bg: 'bg-gray-50' };
  }, [netProfit]);

  const ProfitIcon = profitStatus.icon;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
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
                <p className="text-sm text-muted-foreground">Total Costs</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(totalCosts)}
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
                <p className={`text-xl font-bold ${profitStatus.color}`}>
                  {formatCurrency(netProfit)}
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
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className={`text-xl font-bold ${profitStatus.color}`}>
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Cost Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of operational costs by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costBreakdown.length > 0 ? costBreakdown.map((cost, index) => {
                const colors = [
                  'bg-red-500',
                  'bg-orange-500', 
                  'bg-orange-500',
                  'bg-green-500',
                  'bg-blue-500',
                  'bg-indigo-500',
                  'bg-purple-500'
                ];
                const colorClass = colors[index % colors.length];
                
                return (
                  <div key={cost.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-sm ${colorClass}`} />
                        <span className="text-sm font-medium capitalize">
                          {cost.category.replace('_', ' ')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {cost.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(cost.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colorClass}`}
                        style={{ width: `${Math.max(cost.percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-muted-foreground">No cost data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of revenue by source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueBreakdown.length > 0 ? revenueBreakdown.map((revenue, index) => {
                const colors = [
                  'bg-green-500',
                  'bg-emerald-500',
                  'bg-teal-500',
                  'bg-cyan-500',
                  'bg-sky-500',
                  'bg-blue-500',
                  'bg-indigo-500'
                ];
                const colorClass = colors[index % colors.length];
                
                return (
                  <div key={revenue.source} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-sm ${colorClass}`} />
                        <span className="text-sm font-medium capitalize">
                          {revenue.source.replace('_', ' ')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {revenue.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(revenue.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colorClass}`}
                        style={{ width: `${Math.max(revenue.percentage, 2)}%` }}
                      />
                    </div>
                    {revenue.quantity && revenue.unitPrice && (
                      <div className="text-xs text-muted-foreground pl-5">
                        {revenue.quantity.toLocaleString()} units × {formatCurrency(revenue.unitPrice)} each
                      </div>
                    )}
                  </div>
                );
              }) : (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-muted-foreground">No revenue data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profitability Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Profitability Analysis
          </CardTitle>
          <CardDescription>
            Financial performance metrics and analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {totalCosts > 0 ? ((totalRevenue / totalCosts) * 100).toFixed(0) : '0'}%
              </div>
              <p className="text-sm text-muted-foreground">Revenue to Cost Ratio</p>
              <p className="text-xs text-muted-foreground mt-1">
                Revenue covers {totalCosts > 0 ? (totalRevenue / totalCosts).toFixed(1) : '0'}x the costs
              </p>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${profitStatus.color}`}>
                {profitMargin > 0 ? '+' : ''}{profitMargin.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Profit Margin</p>
              <p className="text-xs text-muted-foreground mt-1">
                {profitMargin > 15 ? 'Excellent profitability' : 
                 profitMargin > 5 ? 'Good profitability' :
                 profitMargin > 0 ? 'Moderate profitability' : 'Operating at loss'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {totalRevenue > 0 ? (((totalRevenue - totalCosts) / totalRevenue) * 100).toFixed(1) : '0'}%
              </div>
              <p className="text-sm text-muted-foreground">Efficiency Ratio</p>
              <p className="text-xs text-muted-foreground mt-1">
                Profit per rupee of revenue generated
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}