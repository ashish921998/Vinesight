'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Bug,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  Calendar,
  AlertTriangle,
  Shield,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Leaf
} from 'lucide-react'
import {
  DiseasePredictionModel,
  type DiseaseRiskInputs,
  type DiseasePredictionResults,
  type WeatherData
} from '@/lib/disease-prediction'

export function DiseasePredictionComponent() {
  const [inputs, setInputs] = useState<DiseaseRiskInputs>({
    weatherData: [],
    grapeVariety: 'cabernet_sauvignon',
    growthStage: 'flowering',
    previousTreatments: {
      fungicide: null,
      bactericide: null,
      insecticide: null
    },
    vineyardConditions: {
      canopyDensity: 'moderate',
      airCirculation: 'moderate',
      drainageQuality: 'moderate'
    },
    location: {
      latitude: 38.5,
      longitude: -122.5,
      elevation: 100
    }
  })

  const [weatherInput, setWeatherInput] = useState({
    temperature: 22,
    humidity: 65,
    rainfall: 0,
    windSpeed: 2.5,
    leafWetnessDuration: 4,
    date: new Date().toISOString().split('T')[0]
  })

  const [results, setResults] = useState<DiseasePredictionResults | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // Sample weather data for demonstration
  useEffect(() => {
    const sampleWeatherData: WeatherData[] = Array.from({ length: 7 }, (_, i) => ({
      temperature: 20 + Math.random() * 10,
      humidity: 60 + Math.random() * 30,
      rainfall: Math.random() > 0.7 ? Math.random() * 15 : 0,
      windSpeed: 1 + Math.random() * 4,
      leafWetnessDuration: Math.random() * 12,
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
    }))

    setInputs((prev) => ({ ...prev, weatherData: sampleWeatherData }))
  }, [])

  const addWeatherData = () => {
    const newWeatherData: WeatherData = {
      ...weatherInput,
      date: new Date(weatherInput.date)
    }

    setInputs((prev) => ({
      ...prev,
      weatherData: [...prev.weatherData, newWeatherData].slice(-14) // Keep last 14 days
    }))

    // Reset form
    setWeatherInput({
      temperature: 22,
      humidity: 65,
      rainfall: 0,
      windSpeed: 2.5,
      leafWetnessDuration: 4,
      date: new Date().toISOString().split('T')[0]
    })
  }

  const calculateRisk = () => {
    setIsCalculating(true)

    setTimeout(() => {
      const predictionResults = DiseasePredictionModel.predictDiseaseRisk(inputs)
      setResults(predictionResults)
      setIsCalculating(false)
    }, 1500)
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'bg-red-600'
      case 'high':
        return 'bg-orange-500'
      case 'moderate':
        return 'bg-orange-500'
      default:
        return 'bg-green-500'
    }
  }

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'moderate':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Bug className="h-6 w-6" />
            Disease Prediction System
          </CardTitle>
          <CardDescription className="text-red-700">
            AI-powered disease risk assessment based on weather patterns and vineyard conditions
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="weather">Weather Data</TabsTrigger>
          <TabsTrigger value="prediction">Risk Analysis</TabsTrigger>
          <TabsTrigger value="calendar">Treatment Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5" />
                  Vineyard Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="variety">Grape Variety</Label>
                  <Select
                    value={inputs.grapeVariety}
                    onValueChange={(value: any) =>
                      setInputs((prev) => ({ ...prev, grapeVariety: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cabernet_sauvignon">Cabernet Sauvignon</SelectItem>
                      <SelectItem value="chardonnay">Chardonnay</SelectItem>
                      <SelectItem value="pinot_noir">Pinot Noir</SelectItem>
                      <SelectItem value="merlot">Merlot</SelectItem>
                      <SelectItem value="sauvignon_blanc">Sauvignon Blanc</SelectItem>
                      <SelectItem value="riesling">Riesling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stage">Growth Stage</Label>
                  <Select
                    value={inputs.growthStage}
                    onValueChange={(value: any) =>
                      setInputs((prev) => ({ ...prev, growthStage: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budbreak">Budbreak</SelectItem>
                      <SelectItem value="flowering">Flowering</SelectItem>
                      <SelectItem value="fruit_set">Fruit Set</SelectItem>
                      <SelectItem value="veraison">Veraison</SelectItem>
                      <SelectItem value="harvest">Harvest</SelectItem>
                      <SelectItem value="dormant">Dormant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Vineyard Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Canopy Density</Label>
                  <Select
                    value={inputs.vineyardConditions.canopyDensity}
                    onValueChange={(value: any) =>
                      setInputs((prev) => ({
                        ...prev,
                        vineyardConditions: { ...prev.vineyardConditions, canopyDensity: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="dense">Dense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Air Circulation</Label>
                  <Select
                    value={inputs.vineyardConditions.airCirculation}
                    onValueChange={(value: any) =>
                      setInputs((prev) => ({
                        ...prev,
                        vineyardConditions: { ...prev.vineyardConditions, airCirculation: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Drainage Quality</Label>
                  <Select
                    value={inputs.vineyardConditions.drainageQuality}
                    onValueChange={(value: any) =>
                      setInputs((prev) => ({
                        ...prev,
                        vineyardConditions: { ...prev.vineyardConditions, drainageQuality: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Previous Treatments
              </CardTitle>
              <CardDescription>
                Record recent fungicide, bactericide, and insecticide applications
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="fungicide">Last Fungicide Application</Label>
                <Input
                  type="date"
                  value={inputs.previousTreatments.fungicide?.toISOString().split('T')[0] || ''}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      previousTreatments: {
                        ...prev.previousTreatments,
                        fungicide: e.target.value ? new Date(e.target.value) : null
                      }
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="bactericide">Last Bactericide Application</Label>
                <Input
                  type="date"
                  value={inputs.previousTreatments.bactericide?.toISOString().split('T')[0] || ''}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      previousTreatments: {
                        ...prev.previousTreatments,
                        bactericide: e.target.value ? new Date(e.target.value) : null
                      }
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="insecticide">Last Insecticide Application</Label>
                <Input
                  type="date"
                  value={inputs.previousTreatments.insecticide?.toISOString().split('T')[0] || ''}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      previousTreatments: {
                        ...prev.previousTreatments,
                        insecticide: e.target.value ? new Date(e.target.value) : null
                      }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weather" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CloudRain className="h-5 w-5" />
                  Add Weather Data
                </CardTitle>
                <CardDescription>
                  Input daily weather observations for accurate predictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      type="date"
                      value={weatherInput.date}
                      onChange={(e) =>
                        setWeatherInput((prev) => ({ ...prev, date: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="temperature">Temperature (°C)</Label>
                    <Input
                      type="number"
                      value={weatherInput.temperature}
                      onChange={(e) =>
                        setWeatherInput((prev) => ({
                          ...prev,
                          temperature: parseFloat(e.target.value)
                        }))
                      }
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="humidity">Humidity (%)</Label>
                    <Input
                      type="number"
                      value={weatherInput.humidity}
                      onChange={(e) =>
                        setWeatherInput((prev) => ({
                          ...prev,
                          humidity: parseFloat(e.target.value)
                        }))
                      }
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="rainfall">Rainfall (mm)</Label>
                    <Input
                      type="number"
                      value={weatherInput.rainfall}
                      onChange={(e) =>
                        setWeatherInput((prev) => ({
                          ...prev,
                          rainfall: parseFloat(e.target.value)
                        }))
                      }
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="windSpeed">Wind Speed (m/s)</Label>
                    <Input
                      type="number"
                      value={weatherInput.windSpeed}
                      onChange={(e) =>
                        setWeatherInput((prev) => ({
                          ...prev,
                          windSpeed: parseFloat(e.target.value)
                        }))
                      }
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="leafWetness">Leaf Wetness (hours)</Label>
                    <Input
                      type="number"
                      value={weatherInput.leafWetnessDuration}
                      onChange={(e) =>
                        setWeatherInput((prev) => ({
                          ...prev,
                          leafWetnessDuration: parseFloat(e.target.value)
                        }))
                      }
                      min="0"
                      max="24"
                      step="0.5"
                    />
                  </div>
                </div>

                <Button onClick={addWeatherData} className="w-full">
                  Add Weather Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Weather History
                </CardTitle>
                <CardDescription>
                  Last {inputs.weatherData.length} days of weather data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {inputs.weatherData.slice(-10).map((day, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm font-medium">{day.date.toLocaleDateString()}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3" />
                          {day.temperature.toFixed(1)}°C
                        </span>
                        <span className="flex items-center gap-1">
                          <Droplets className="h-3 w-3" />
                          {day.humidity.toFixed(0)}%
                        </span>
                        <span className="flex items-center gap-1">
                          <CloudRain className="h-3 w-3" />
                          {day.rainfall.toFixed(1)}mm
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="prediction" className="space-y-6">
          <div className="flex justify-center">
            <Button
              onClick={calculateRisk}
              disabled={isCalculating || inputs.weatherData.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
            >
              {isCalculating ? 'Analyzing Risk...' : 'Analyze Disease Risk'}
            </Button>
          </div>

          {isCalculating && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                  <span>Analyzing weather patterns and disease risk factors...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {results && (
            <div className="space-y-6">
              {/* Risk Overview */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Activity className="h-6 w-6" />
                      Disease Risk Assessment
                    </span>
                    <Badge
                      variant={getRiskBadgeVariant(results.overallRisk)}
                      className={`${getRiskColor(results.overallRisk)} text-white`}
                    >
                      {results.overallRisk.toUpperCase()} RISK
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {results.diseases.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Diseases at Risk</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {results.weatherScore}%
                      </div>
                      <div className="text-sm text-muted-foreground">Weather Risk Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.confidence}%</div>
                      <div className="text-sm text-muted-foreground">Prediction Confidence</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alerts */}
              {results.alerts.length > 0 && (
                <Card className="border-gray-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="h-5 w-5" />
                      Active Alerts ({results.alerts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {results.alerts.map((alert, index) => (
                      <Alert
                        key={index}
                        className={
                          alert.severity === 'critical'
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-400 bg-orange-50'
                        }
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <span>
                            <strong>{alert.disease}:</strong> {alert.message}
                          </span>
                          {alert.actionRequired && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {alert.daysUntilAction} days
                            </Badge>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Disease Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {results.diseases.map((disease, index) => (
                  <Card
                    key={index}
                    className="border-l-4"
                    style={{
                      borderLeftColor:
                        disease.riskLevel === 'critical'
                          ? '#dc2626'
                          : disease.riskLevel === 'high'
                            ? '#ea580c'
                            : disease.riskLevel === 'moderate'
                              ? '#ca8a04'
                              : '#16a34a'
                    }}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span>{disease.disease}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRiskBadgeVariant(disease.riskLevel)}>
                            {disease.probability.toFixed(0)}%
                          </Badge>
                        </div>
                      </CardTitle>
                      <CardDescription>
                        Peak risk: {disease.peakRiskDate.toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">
                          Risk Factors:
                        </Label>
                        <ul className="mt-1 space-y-1">
                          {disease.factors.map((factor, i) => (
                            <li key={i} className="text-sm flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-sm font-semibold text-muted-foreground">
                          Recommendations:
                        </Label>
                        <ul className="mt-1 space-y-1">
                          {disease.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm">
                          <strong>Treatment Window:</strong>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Optimal: {disease.treatmentWindow.optimal.toLocaleDateString()} | Latest:{' '}
                          {disease.treatmentWindow.latest.toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          {results && results.treatmentCalendar.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Treatment Schedule
                </CardTitle>
                <CardDescription>
                  Recommended treatment timeline based on disease risk analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.treatmentCalendar.map((entry, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="text-center min-w-[80px]">
                        <div className="text-sm font-medium">
                          {entry.date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </div>

                      <div className="flex-1">
                        {entry.treatments.map((treatment: string, i: number) => (
                          <div key={i} className="text-sm mb-1">
                            {treatment}
                          </div>
                        ))}
                      </div>

                      <Badge
                        variant={
                          entry.priority === 'high'
                            ? 'destructive'
                            : entry.priority === 'medium'
                              ? 'secondary'
                              : 'default'
                        }
                      >
                        {entry.priority.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No treatments scheduled. Run risk analysis first to generate treatment
                  recommendations.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
