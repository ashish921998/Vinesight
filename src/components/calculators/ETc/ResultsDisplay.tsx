import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Droplets, CloudSun } from 'lucide-react'
import type { ETcResults } from '@/lib/etc-calculator'
import { OpenMeteoWeatherService, type OpenMeteoWeatherData } from '@/lib/open-meteo-weather'

interface ResultsDisplayProps {
  results: ETcResults
  date: string
  openMeteoValidationData?: OpenMeteoWeatherData | null
}

export function ResultsDisplay({ results, date, openMeteoValidationData }: ResultsDisplayProps) {
  // Calculate validation against Open-Meteo if available
  const validation = openMeteoValidationData
    ? OpenMeteoWeatherService.validateEToDifference(
        results.eto,
        openMeteoValidationData.et0FaoEvapotranspiration
      )
    : null
  return (
    <div id="results-section" className="mx-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle>ETc Results</CardTitle>
            </div>
            <Badge
              variant={
                results.confidence === 'high'
                  ? 'default'
                  : results.confidence === 'medium'
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {results.confidence.toUpperCase()} CONFIDENCE
            </Badge>
          </div>
          <CardDescription>
            Evapotranspiration and irrigation recommendations for {date}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>ETo (mm/day)</Label>
              <Input value={results.eto.toFixed(2)} readOnly className="h-11" />
            </div>
            <div>
              <Label>ETc (mm/day)</Label>
              <Input value={results.etc.toFixed(2)} readOnly className="h-11" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kc</Label>
              <Input value={results.kc.toFixed(2)} readOnly className="h-11" />
            </div>
            <div>
              <Label>Need (mm)</Label>
              <Input value={results.irrigationNeed.toFixed(2)} readOnly className="h-11" />
            </div>
          </div>

          {/* Irrigation Recommendation */}
          {/* Irrigation Recommendation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Irrigation Recommendation</h3>
            </div>

            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <Label className="text-xs text-gray-500">Should Irrigate?</Label>
                    <p
                      className={`font-bold text-lg ${results.irrigationRecommendation.shouldIrrigate ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {results.irrigationRecommendation.shouldIrrigate ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Duration (hours)</Label>
                    <p className="font-bold text-lg">
                      {results.irrigationRecommendation.duration.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <Label className="text-xs text-gray-500">Frequency</Label>
                  <p className="font-semibold">{results.irrigationRecommendation.frequency}</p>
                </div>
              </CardContent>
            </Card>

            {results.irrigationRecommendation.notes &&
              results.irrigationRecommendation.notes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-1.5">Additional Notes:</h4>
                  <ul className="space-y-1 text-xs text-gray-700 list-disc list-inside">
                    {results.irrigationRecommendation.notes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Open-Meteo Validation */}
            {validation && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <CloudSun className="h-4 w-4 text-blue-500" />
                  <h4 className="font-semibold text-sm">Open-Meteo Validation</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2 bg-gray-50 rounded">
                    <Label className="text-gray-500">Our ETo</Label>
                    <p className="font-semibold">{results.eto.toFixed(2)} mm/day</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <Label className="text-gray-500">Open-Meteo ETo</Label>
                    <p className="font-semibold">
                      {openMeteoValidationData!.et0FaoEvapotranspiration.toFixed(2)} mm/day
                    </p>
                  </div>
                </div>

                <div
                  className="mt-3 p-3 rounded-lg"
                  style={{
                    backgroundColor: validation.isAccurate ? '#f0f9f0' : '#fef3f2',
                    border: `1px solid ${validation.isAccurate ? '#d1f2d1' : '#feddc7'}`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge
                        variant={validation.isAccurate ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {validation.isAccurate ? 'ACCURATE' : 'DEVIATION'}
                      </Badge>
                      <p
                        className="text-xs mt-1"
                        style={{
                          color: validation.isAccurate ? '#22c55e' : '#ef4444'
                        }}
                      >
                        Difference: {validation.difference > 0 ? '+' : ''}
                        {validation.difference} mm/day
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-lg font-bold"
                        style={{
                          color: validation.isAccurate ? '#22c55e' : '#ef4444'
                        }}
                      >
                        {validation.percentageError > 0 ? '+' : ''}
                        {validation.percentageError}%
                      </p>
                      <p className="text-xs text-gray-500">error</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
