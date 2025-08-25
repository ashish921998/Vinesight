"use client";

import { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Loading component for better UX
const LoadingSpinner = ({ text = "Loading..." }: { text?: string }) => (
  <Card className="w-full">
    <CardContent className="flex items-center justify-center p-8">
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">{text}</span>
      </div>
    </CardContent>
  </Card>
);

// Lazy load heavy components
export const LazyWeatherDashboard = lazy(() => 
  import('@/components/weather/WeatherDashboard').then(module => ({
    default: module.WeatherDashboard
  }))
);

export const LazyFinancialChart = lazy(() => 
  import('@/components/reports/FinancialChart').then(module => ({
    default: module.FinancialChart
  }))
);

export const LazyComplianceStatus = lazy(() => 
  import('@/components/reports/ComplianceStatus').then(module => ({
    default: module.ComplianceStatus
  }))
);

export const LazyAnalyticsDashboard = lazy(() => 
  import('@/components/analytics/AnalyticsDashboard').then(module => ({
    default: module.AnalyticsDashboard
  }))
);

export const LazyCostAnalysisChart = lazy(() => 
  import('@/components/analytics/CostAnalysisChart').then(module => ({
    default: module.CostAnalysisChart
  }))
);

export const LazyYieldPredictionChart = lazy(() => 
  import('@/components/analytics/YieldPredictionChart').then(module => ({
    default: module.YieldPredictionChart
  }))
);

export const LazyPerformanceInsights = lazy(() => 
  import('@/components/analytics/PerformanceInsights').then(module => ({
    default: module.PerformanceInsights
  }))
);

// Wrapper components with Suspense
export const WeatherDashboardWithSuspense = (props: any) => (
  <Suspense fallback={<LoadingSpinner text="Loading weather data..." />}>
    <LazyWeatherDashboard {...props} />
  </Suspense>
);

export const FinancialChartWithSuspense = (props: any) => (
  <Suspense fallback={<LoadingSpinner text="Loading financial charts..." />}>
    <LazyFinancialChart {...props} />
  </Suspense>
);

export const ComplianceStatusWithSuspense = (props: any) => (
  <Suspense fallback={<LoadingSpinner text="Loading compliance data..." />}>
    <LazyComplianceStatus {...props} />
  </Suspense>
);

export const AnalyticsDashboardWithSuspense = (props: any) => (
  <Suspense fallback={<LoadingSpinner text="Loading analytics dashboard..." />}>
    <LazyAnalyticsDashboard {...props} />
  </Suspense>
);

export const CostAnalysisChartWithSuspense = (props: any) => (
  <Suspense fallback={<LoadingSpinner text="Loading cost analysis..." />}>
    <LazyCostAnalysisChart {...props} />
  </Suspense>
);

export const YieldPredictionChartWithSuspense = (props: any) => (
  <Suspense fallback={<LoadingSpinner text="Loading yield predictions..." />}>
    <LazyYieldPredictionChart {...props} />
  </Suspense>
);

export const PerformanceInsightsWithSuspense = (props: any) => (
  <Suspense fallback={<LoadingSpinner text="Loading performance insights..." />}>
    <LazyPerformanceInsights {...props} />
  </Suspense>
);

// Route-level lazy loading
export const LazyReportsPage = lazy(() => 
  import('@/app/reports/page').then(module => ({
    default: module.default
  }))
);

export const LazyAnalyticsPage = lazy(() => 
  import('@/app/analytics/page').then(module => ({
    default: module.default
  }))
);

export const LazyWeatherPage = lazy(() => 
  import('@/app/weather/page').then(module => ({
    default: module.default
  }))
);

export const LazyPWASettingsPage = lazy(() => 
  import('@/app/pwa-settings/page').then(module => ({
    default: module.default
  }))
);

// Page-level wrappers with Suspense
export const ReportsPageWithSuspense = () => (
  <Suspense fallback={<LoadingSpinner text="Loading reports..." />}>
    <LazyReportsPage />
  </Suspense>
);

export const AnalyticsPageWithSuspense = () => (
  <Suspense fallback={<LoadingSpinner text="Loading analytics..." />}>
    <LazyAnalyticsPage />
  </Suspense>
);

export const WeatherPageWithSuspense = () => (
  <Suspense fallback={<LoadingSpinner text="Loading weather..." />}>
    <LazyWeatherPage />
  </Suspense>
);

export const PWASettingsPageWithSuspense = () => (
  <Suspense fallback={<LoadingSpinner text="Loading PWA settings..." />}>
    <LazyPWASettingsPage />
  </Suspense>
);