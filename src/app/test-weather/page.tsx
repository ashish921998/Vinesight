'use client'

import { WeatherCard } from '@/components/farm-details/WeatherCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Mock farm data for testing
const mockFarm = {
  id: 1,
  name: 'Test Vineyard',
  region: 'Nashik, Maharashtra',
  area: 5, // acres
  crop: 'Grapes',
  cropVariety: 'Thompson Seedless',
  plantingDate: '2022-01-15',
  latitude: 19.9975,
  longitude: 73.7898,
  locationName: 'Nashik',
  userId: 'test-user'
}

export default function TestWeatherPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Weather Accuracy System Test Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This page tests the new Weather & Accuracy features including:
            </p>
            <ul className="text-sm space-y-1 mb-4">
              <li>✅ Weather data display with provider selection</li>
              <li>✅ Accuracy Insights (current level, progress, milestones)</li>
              <li>✅ Local Sensor Input (enter readings, refine ETo)</li>
              <li>✅ Toast notifications</li>
              <li>✅ Loading spinners</li>
            </ul>
            <p className="text-xs text-amber-600">
              ⚠️ Note: Database features will show default values until migration is run.
            </p>
          </CardContent>
        </Card>

        {/* WeatherCard with all 3 tabs */}
        <WeatherCard farm={mockFarm} />

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">📝 Testing Checklist:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Tab 1 - Weather:</strong>
                <ul className="list-disc list-inside ml-4 text-muted-foreground">
                  <li>Provider selector dropdown works</li>
                  <li>Weather data loads</li>
                  <li>ETo value displays</li>
                </ul>
              </div>
              <div>
                <strong>Tab 2 - Accuracy:</strong>
                <ul className="list-disc list-inside ml-4 text-muted-foreground">
                  <li>Shows loading spinner first</li>
                  <li>Displays accuracy level (Basic by default)</li>
                  <li>Shows validation count: 0</li>
                  <li>Shows sensor status: No</li>
                  <li>Recommendations appear</li>
                </ul>
              </div>
              <div>
                <strong>Tab 3 - Sensors:</strong>
                <ul className="list-disc list-inside ml-4 text-muted-foreground">
                  <li>Form renders correctly</li>
                  <li>Enter temp (max: 35, min: 22)</li>
                  <li>Click &quot;Refine ETo&quot; → spinner appears</li>
                  <li>Toast notification appears (top-right)</li>
                  <li>Results tab shows comparison</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
