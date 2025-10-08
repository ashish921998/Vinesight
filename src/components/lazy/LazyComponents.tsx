'use client'

import { lazy, Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Loading component for better UX
const LoadingSpinner = ({ text = 'Loading...' }: { text?: string }) => (
  <Card className="w-full">
    <CardContent className="flex items-center justify-center p-8">
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">{text}</span>
      </div>
    </CardContent>
  </Card>
)

// Lazy load heavy components
export const LazyWeatherDashboard = lazy(() =>
  import('@/components/weather/WeatherDashboard').then((module) => ({
    default: module.WeatherDashboard
  }))
)

export const LazyFinancialChart = lazy(() =>
  import('@/components/reports/FinancialChart').then((module) => ({
    default: module.FinancialChart
  }))
)

export const LazyComplianceStatus = lazy(() =>
  import('@/components/reports/ComplianceStatus').then((module) => ({
    default: module.ComplianceStatus
  }))
)

// Wrapper components with Suspense
export const WeatherDashboardWithSuspense = (props: any) => (
  <Suspense fallback={<LoadingSpinner text="Loading weather data..." />}>
    <LazyWeatherDashboard {...props} />
  </Suspense>
)

export const FinancialChartWithSuspense = (props: any) => (
  <Suspense fallback={<LoadingSpinner text="Loading financial charts..." />}>
    <LazyFinancialChart {...props} />
  </Suspense>
)

export const ComplianceStatusWithSuspense = (props: any) => (
  <Suspense fallback={<LoadingSpinner text="Loading compliance data..." />}>
    <LazyComplianceStatus {...props} />
  </Suspense>
)

// Route-level lazy loading
export const LazyReportsPage = lazy(() =>
  import('@/app/reports/page').then((module) => ({
    default: module.default
  }))
)

export const LazyAnalyticsPage = lazy(() =>
  import('@/app/analytics/page').then((module) => ({
    default: module.default
  }))
)

export const LazyWeatherPage = lazy(() =>
  import('@/app/weather/page').then((module) => ({
    default: module.default
  }))
)

// Page-level wrappers with Suspense
export const ReportsPageWithSuspense = () => (
  <Suspense fallback={<LoadingSpinner text="Loading reports..." />}>
    <LazyReportsPage />
  </Suspense>
)

export const AnalyticsPageWithSuspense = () => (
  <Suspense fallback={<LoadingSpinner text="Loading analytics..." />}>
    <LazyAnalyticsPage />
  </Suspense>
)

export const WeatherPageWithSuspense = () => (
  <Suspense fallback={<LoadingSpinner text="Loading weather..." />}>
    <LazyWeatherPage />
  </Suspense>
)
