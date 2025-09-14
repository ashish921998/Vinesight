'use client'

import { useState, useEffect } from 'react'
import { PortfolioDashboard } from '@/components/dashboard/PortfolioDashboard'
import { FarmerDashboard } from '@/components/dashboard/FarmerDashboard'
import { FarmSelector, FarmTabs } from '@/components/dashboard/FarmSelector'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'

// Mock farms data matching the PortfolioDashboard
const farms = [
  {
    id: 'farm1',
    name: 'Vineyard Valley',
    location: 'Nashik, Maharashtra',
    status: 'healthy' as const,
    healthScore: 92,
    criticalAlerts: 0,
    profitMargin: 45.2,
  },
  {
    id: 'farm2',
    name: 'Sunset Orchards',
    location: 'Pune, Maharashtra',
    status: 'attention' as const,
    healthScore: 76,
    criticalAlerts: 1,
    profitMargin: 32.1,
  },
  {
    id: 'farm3',
    name: 'Green Acres',
    location: 'Solapur, Maharashtra',
    status: 'critical' as const,
    healthScore: 58,
    criticalAlerts: 3,
    profitMargin: 18.7,
  },
  {
    id: 'farm4',
    name: 'Highland Farms',
    location: 'Satara, Maharashtra',
    status: 'healthy' as const,
    healthScore: 88,
    criticalAlerts: 0,
    profitMargin: 52.4,
  },
]

export default function PortfolioPage() {
  const [currentView, setCurrentView] = useState<'portfolio' | 'farm'>('portfolio')
  const [selectedFarmId, setSelectedFarmId] = useState<string>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }, [])

  const handleFarmSelect = (farmId: string) => {
    setSelectedFarmId(farmId)
    setCurrentView('farm')
  }

  const handlePortfolioSelect = () => {
    setSelectedFarmId(undefined)
    setCurrentView('portfolio')
  }

  const selectedFarm = farms.find((farm) => farm.id === selectedFarmId)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse p-4">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
          <div className="h-12 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header with Navigation */}
      <div className="sticky top-0 z-50 bg-background border-b border-border p-3">
        <div className="flex items-center gap-3 mb-3">
          {currentView === 'farm' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePortfolioSelect}
              className="h-9 w-9 p-0 touch-manipulation"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <div className="flex-1">
            <FarmSelector
              farms={farms}
              selectedFarmId={selectedFarmId}
              showPortfolio={true}
              onFarmSelect={handleFarmSelect}
              onPortfolioSelect={handlePortfolioSelect}
            />
          </div>

          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 touch-manipulation">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Farm Tabs */}
        {currentView === 'portfolio' && (
          <FarmTabs
            farms={farms}
            selectedFarmId={selectedFarmId}
            onFarmSelect={handleFarmSelect}
            maxTabs={4}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="pb-20">
        {currentView === 'portfolio' ? (
          <PortfolioDashboard onFarmSelect={handleFarmSelect} />
        ) : (
          <div>
            {/* Farm Context Header */}
            {selectedFarm && (
              <div className="bg-primary/5 border-b border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      selectedFarm.status === 'healthy'
                        ? 'bg-green-500'
                        : selectedFarm.status === 'attention'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm font-medium">{selectedFarm.name}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{selectedFarm.location}</span>
                </div>
              </div>
            )}

            {/* Individual Farm Dashboard */}
            <FarmerDashboard />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation (reuse existing) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center">
          <Link
            href="/"
            className={`
              flex flex-col items-center justify-center
              px-2 py-2 min-w-0 flex-1
              transition-all duration-200
              touch-manipulation
              active:scale-95
              ${currentView === 'portfolio' ? 'text-primary border-t-2 border-primary' : 'text-gray-400 hover:text-gray-600'}
            `}
          >
            <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            <span className="text-xs">Portfolio</span>
          </Link>

          <Link
            href="/farms"
            className="
              flex flex-col items-center justify-center
              px-2 py-2 min-w-0 flex-1
              transition-all duration-200
              touch-manipulation
              active:scale-95
              text-gray-400 hover:text-gray-600
            "
          >
            <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs">Farms</span>
          </Link>

          <a
            href="/ai-assistant"
            className="
              flex flex-col items-center justify-center
              px-2 py-2 min-w-0 flex-1
              transition-all duration-200
              touch-manipulation
              active:scale-95
              text-gray-400 hover:text-gray-600
            "
          >
            <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs">AI</span>
          </a>

          <a
            href="/calculators"
            className="
              flex flex-col items-center justify-center
              px-2 py-2 min-w-0 flex-1
              transition-all duration-200
              touch-manipulation
              active:scale-95
              text-gray-400 hover:text-gray-600
            "
          >
            <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs">Calculator</span>
          </a>

          <a
            href="/settings"
            className="
              flex flex-col items-center justify-center
              px-2 py-2 min-w-0 flex-1
              transition-all duration-200
              touch-manipulation
              active:scale-95
              text-gray-400 hover:text-gray-600
            "
          >
            <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs">Profile</span>
          </a>
        </div>
      </div>
    </div>
  )
}
