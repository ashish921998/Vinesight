export interface SensorReading {
  sensorId: string
  farmId: string
  sensorType: SensorType
  timestamp: Date
  value: number
  unit: string
  location: {
    latitude: number
    longitude: number
    description: string
  }
  batteryLevel?: number // 0-100
  signalStrength?: number // 0-100
  status: 'active' | 'inactive' | 'error' | 'maintenance'
}

export type SensorType =
  | 'soil_moisture'
  | 'soil_temperature'
  | 'air_temperature'
  | 'air_humidity'
  | 'light_intensity'
  | 'ph_level'
  | 'electrical_conductivity'
  | 'nutrient_npk'
  | 'leaf_wetness'
  | 'wind_speed'
  | 'rainfall'
  | 'atmospheric_pressure'
  | 'soil_compaction'
  | 'co2_level'

export interface SensorDevice {
  id: string
  name: string
  type: SensorType
  manufacturer: string
  model: string
  installationDate: Date
  calibrationDate: Date
  nextMaintenanceDate: Date
  location: {
    latitude: number
    longitude: number
    depth?: number // for soil sensors
    height?: number // for air sensors
    description: string
  }
  thresholds: {
    min: number
    max: number
    optimal: { min: number; max: number }
  }
  alertsEnabled: boolean
  dataInterval: number // minutes
  farmId: string
}

export interface SensorAlert {
  id: string
  sensorId: string
  alertType: 'threshold' | 'offline' | 'battery_low' | 'calibration_due' | 'maintenance_due'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: Date
  acknowledged: boolean
  actionTaken?: string
  resolvedAt?: Date
}

export interface SensorAnalytics {
  sensorId: string
  timeRange: '24h' | '7d' | '30d' | '90d'
  statistics: {
    average: number
    minimum: number
    maximum: number
    standardDeviation: number
    trend: 'increasing' | 'decreasing' | 'stable'
  }
  recommendations: string[]
  anomalies: {
    timestamp: Date
    value: number
    type: 'spike' | 'drop' | 'pattern_break'
    severity: 'minor' | 'major' | 'critical'
  }[]
}

export interface IrrigationControlSignal {
  action: 'start' | 'stop' | 'adjust'
  duration?: number // minutes
  zone?: string
  flowRate?: number // liters per minute
  reason: string
  triggeredBy: string[]
}

export interface FertilizationSignal {
  nutrient: 'nitrogen' | 'phosphorus' | 'potassium' | 'mixed'
  concentration: number // ppm or percentage
  duration: number // minutes
  zone: string
  reason: string
  urgency: 'low' | 'medium' | 'high'
}

export class IoTSensorService {
  private static sensors: Map<string, SensorDevice> = new Map()
  private static readings: Map<string, SensorReading[]> = new Map()
  private static alerts: SensorAlert[] = []
  private static isConnected = false
  private static websocket: WebSocket | null = null

  // Initialize IoT connection
  static async initialize(farmId: string): Promise<boolean> {
    try {
      // In production, this would connect to actual IoT platform
      // For now, we'll simulate the connection and generate sample data
      this.generateSampleSensors(farmId)
      this.startDataSimulation()
      this.isConnected = true

      return true
    } catch (error) {
      console.error('Failed to initialize IoT service:', error)
      return false
    }
  }

  // Get all sensors for a farm
  static getSensors(farmId: string): SensorDevice[] {
    return Array.from(this.sensors.values()).filter((sensor) => sensor.farmId === farmId)
  }

  // Get recent readings for a sensor
  static getSensorReadings(
    sensorId: string,
    timeRange: '1h' | '6h' | '24h' | '7d' = '24h'
  ): SensorReading[] {
    const readings = this.readings.get(sensorId) || []
    const now = new Date()
    const cutoffTime = new Date(now)

    switch (timeRange) {
      case '1h':
        cutoffTime.setHours(cutoffTime.getHours() - 1)
        break
      case '6h':
        cutoffTime.setHours(cutoffTime.getHours() - 6)
        break
      case '24h':
        cutoffTime.setDate(cutoffTime.getDate() - 1)
        break
      case '7d':
        cutoffTime.setDate(cutoffTime.getDate() - 7)
        break
    }

    return readings
      .filter((reading) => reading.timestamp >= cutoffTime)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Get current sensor values
  static getCurrentReadings(farmId: string): { [sensorId: string]: SensorReading } {
    const farmSensors = this.getSensors(farmId)
    const currentReadings: { [sensorId: string]: SensorReading } = {}

    farmSensors.forEach((sensor) => {
      const readings = this.readings.get(sensor.id) || []
      if (readings.length > 0) {
        currentReadings[sensor.id] = readings[readings.length - 1]
      }
    })

    return currentReadings
  }

  // Get sensor analytics
  static getSensorAnalytics(
    sensorId: string,
    timeRange: '24h' | '7d' | '30d' | '90d' = '7d'
  ): SensorAnalytics {
    const readings = this.getSensorReadings(sensorId, timeRange as any)
    const values = readings.map((r) => r.value)

    if (values.length === 0) {
      return {
        sensorId,
        timeRange,
        statistics: {
          average: 0,
          minimum: 0,
          maximum: 0,
          standardDeviation: 0,
          trend: 'stable'
        },
        recommendations: ['No data available for analysis'],
        anomalies: []
      }
    }

    const statistics = this.calculateStatistics(values)
    const trend = this.calculateTrend(values)
    const anomalies = this.detectAnomalies(readings)
    const recommendations = this.generateSensorRecommendations(sensorId, statistics, readings)

    return {
      sensorId,
      timeRange,
      statistics: { ...statistics, trend },
      recommendations,
      anomalies
    }
  }

  // Get active alerts
  static getActiveAlerts(farmId?: string): SensorAlert[] {
    let alerts = this.alerts.filter((alert) => !alert.acknowledged && !alert.resolvedAt)

    if (farmId) {
      const farmSensorIds = this.getSensors(farmId).map((s) => s.id)
      alerts = alerts.filter((alert) => farmSensorIds.includes(alert.sensorId))
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })
  }

  // Process sensor data for irrigation automation
  static evaluateIrrigationNeeds(farmId: string): IrrigationControlSignal[] {
    const sensors = this.getSensors(farmId)
    const signals: IrrigationControlSignal[] = []

    // Get soil moisture sensors
    const moistureSensors = sensors.filter((s) => s.type === 'soil_moisture')

    moistureSensors.forEach((sensor) => {
      const currentReading = this.getCurrentReadings(farmId)[sensor.id]

      if (currentReading && currentReading.value < sensor.thresholds.optimal.min) {
        signals.push({
          action: 'start',
          duration: this.calculateIrrigationDuration(currentReading.value, sensor.thresholds),
          zone: sensor.location.description,
          flowRate: 20, // L/min
          reason: `Soil moisture ${currentReading.value}% below optimal range`,
          triggeredBy: [sensor.id]
        })
      }
    })

    return signals
  }

  // Process sensor data for fertilization recommendations
  static evaluateFertilizationNeeds(farmId: string): FertilizationSignal[] {
    const sensors = this.getSensors(farmId)
    const signals: FertilizationSignal[] = []

    // Get nutrient sensors
    const nutrientSensors = sensors.filter((s) => s.type === 'nutrient_npk')

    nutrientSensors.forEach((sensor) => {
      const currentReading = this.getCurrentReadings(farmId)[sensor.id]

      if (currentReading && currentReading.value < sensor.thresholds.optimal.min) {
        signals.push({
          nutrient: 'mixed',
          concentration: this.calculateNutrientConcentration(currentReading.value),
          duration: 30,
          zone: sensor.location.description,
          reason: `Nutrient levels ${currentReading.value} ppm below optimal`,
          urgency: currentReading.value < sensor.thresholds.min ? 'high' : 'medium'
        })
      }
    })

    return signals
  }

  // Environmental monitoring
  static getEnvironmentalSummary(farmId: string): {
    temperature: { current: number; trend: string; status: string }
    humidity: { current: number; trend: string; status: string }
    soilMoisture: { average: number; zones: { [key: string]: number } }
    alerts: number
    batteryLevels: { low: number; critical: number }
  } {
    const sensors = this.getSensors(farmId)
    const currentReadings = this.getCurrentReadings(farmId)

    const tempSensors = sensors.filter((s) => s.type === 'air_temperature')
    const humiditySensors = sensors.filter((s) => s.type === 'air_humidity')
    const moistureSensors = sensors.filter((s) => s.type === 'soil_moisture')

    const avgTemp = this.averageCurrentValue(tempSensors, currentReadings)
    const avgHumidity = this.averageCurrentValue(humiditySensors, currentReadings)

    const soilMoisture = {
      average: this.averageCurrentValue(moistureSensors, currentReadings),
      zones: {} as { [key: string]: number }
    }

    moistureSensors.forEach((sensor) => {
      const reading = currentReadings[sensor.id]
      if (reading) {
        soilMoisture.zones[sensor.location.description] = reading.value
      }
    })

    const activeAlerts = this.getActiveAlerts(farmId)
    const batteryAlerts = activeAlerts.filter((a) => a.alertType === 'battery_low')

    return {
      temperature: {
        current: avgTemp,
        trend: 'stable', // Simplified
        status: avgTemp > 35 ? 'high' : avgTemp < 15 ? 'low' : 'normal'
      },
      humidity: {
        current: avgHumidity,
        trend: 'stable',
        status: avgHumidity > 80 ? 'high' : avgHumidity < 40 ? 'low' : 'normal'
      },
      soilMoisture,
      alerts: activeAlerts.length,
      batteryLevels: {
        low: batteryAlerts.filter((a) => a.severity === 'medium').length,
        critical: batteryAlerts.filter((a) => a.severity === 'high').length
      }
    }
  }

  // Calibrate sensor
  static async calibrateSensor(sensorId: string, referenceValue: number): Promise<boolean> {
    const sensor = this.sensors.get(sensorId)
    if (!sensor) return false

    try {
      // In production, this would send calibration command to physical sensor
      sensor.calibrationDate = new Date()
      return true
    } catch (error) {
      console.error('Sensor calibration failed:', error)
      return false
    }
  }

  // Update sensor thresholds
  static updateSensorThresholds(sensorId: string, thresholds: SensorDevice['thresholds']): boolean {
    const sensor = this.sensors.get(sensorId)
    if (!sensor) return false

    sensor.thresholds = thresholds
    // Thresholds updated successfully
    return true
  }

  // Acknowledge alert
  static acknowledgeAlert(alertId: string, actionTaken?: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId)
    if (!alert) return false

    alert.acknowledged = true
    alert.actionTaken = actionTaken
    return true
  }

  private static generateSampleSensors(farmId: string) {
    const sampleSensors: SensorDevice[] = [
      {
        id: 'soil_moisture_01',
        name: 'Zone A Soil Moisture',
        type: 'soil_moisture',
        manufacturer: 'AgriTech',
        model: 'SM-100',
        installationDate: new Date('2024-01-15'),
        calibrationDate: new Date('2024-01-15'),
        nextMaintenanceDate: new Date('2024-07-15'),
        location: {
          latitude: 18.5204,
          longitude: 73.8567,
          depth: 20,
          description: 'Zone A - Block 1'
        },
        thresholds: {
          min: 20,
          max: 80,
          optimal: { min: 40, max: 70 }
        },
        alertsEnabled: true,
        dataInterval: 15,
        farmId
      },
      {
        id: 'air_temp_01',
        name: 'Weather Station Temperature',
        type: 'air_temperature',
        manufacturer: 'WeatherTech',
        model: 'WT-200',
        installationDate: new Date('2024-01-15'),
        calibrationDate: new Date('2024-02-01'),
        nextMaintenanceDate: new Date('2024-08-01'),
        location: {
          latitude: 18.5204,
          longitude: 73.8567,
          height: 2,
          description: 'Central Weather Station'
        },
        thresholds: {
          min: 10,
          max: 45,
          optimal: { min: 20, max: 35 }
        },
        alertsEnabled: true,
        dataInterval: 10,
        farmId
      },
      {
        id: 'ph_sensor_01',
        name: 'Soil pH Monitor',
        type: 'ph_level',
        manufacturer: 'SoilTech',
        model: 'PH-50',
        installationDate: new Date('2024-02-01'),
        calibrationDate: new Date('2024-02-01'),
        nextMaintenanceDate: new Date('2024-08-01'),
        location: {
          latitude: 18.5204,
          longitude: 73.8567,
          depth: 15,
          description: 'Zone B - Testing Point'
        },
        thresholds: {
          min: 5.5,
          max: 8.5,
          optimal: { min: 6.0, max: 7.5 }
        },
        alertsEnabled: true,
        dataInterval: 60,
        farmId
      }
    ]

    sampleSensors.forEach((sensor) => {
      this.sensors.set(sensor.id, sensor)
      this.readings.set(sensor.id, [])
    })
  }

  private static startDataSimulation() {
    // Simulate real-time sensor data
    setInterval(() => {
      this.sensors.forEach((sensor) => {
        const reading = this.generateSampleReading(sensor)
        this.addReading(reading)
        this.checkThresholds(sensor, reading)
      })
    }, 30000) // Every 30 seconds for demo
  }

  private static generateSampleReading(sensor: SensorDevice): SensorReading {
    let value: number
    let unit: string

    switch (sensor.type) {
      case 'soil_moisture':
        value = 30 + Math.random() * 40 // 30-70%
        unit = '%'
        break
      case 'air_temperature':
        value = 20 + Math.random() * 15 // 20-35°C
        unit = '°C'
        break
      case 'air_humidity':
        value = 40 + Math.random() * 40 // 40-80%
        unit = '%'
        break
      case 'ph_level':
        value = 6.0 + Math.random() * 1.5 // 6.0-7.5 pH
        unit = 'pH'
        break
      case 'electrical_conductivity':
        value = 0.5 + Math.random() * 2.0 // 0.5-2.5 dS/m
        unit = 'dS/m'
        break
      case 'nutrient_npk':
        value = 50 + Math.random() * 100 // 50-150 ppm
        unit = 'ppm'
        break
      default:
        value = Math.random() * 100
        unit = 'units'
    }

    return {
      sensorId: sensor.id,
      farmId: sensor.farmId,
      sensorType: sensor.type,
      timestamp: new Date(),
      value: Number(value.toFixed(2)),
      unit,
      location: {
        latitude: sensor.location.latitude,
        longitude: sensor.location.longitude,
        description: sensor.location.description
      },
      batteryLevel: 80 + Math.random() * 20,
      signalStrength: 70 + Math.random() * 30,
      status: 'active'
    }
  }

  private static addReading(reading: SensorReading) {
    const readings = this.readings.get(reading.sensorId) || []
    readings.push(reading)

    // Keep only last 1000 readings per sensor
    if (readings.length > 1000) {
      readings.splice(0, readings.length - 1000)
    }

    this.readings.set(reading.sensorId, readings)
  }

  private static checkThresholds(sensor: SensorDevice, reading: SensorReading) {
    if (!sensor.alertsEnabled) return

    if (reading.value < sensor.thresholds.min || reading.value > sensor.thresholds.max) {
      const alert: SensorAlert = {
        id: `alert_${Date.now()}_${sensor.id}`,
        sensorId: sensor.id,
        alertType: 'threshold',
        severity:
          reading.value < sensor.thresholds.min * 0.5 || reading.value > sensor.thresholds.max * 1.5
            ? 'critical'
            : 'high',
        message: `${sensor.name}: ${reading.value}${reading.unit} is ${reading.value < sensor.thresholds.min ? 'below minimum' : 'above maximum'} threshold`,
        timestamp: reading.timestamp,
        acknowledged: false
      }

      this.alerts.push(alert)
    }

    // Battery level check
    if (reading.batteryLevel && reading.batteryLevel < 20) {
      const alert: SensorAlert = {
        id: `battery_alert_${Date.now()}_${sensor.id}`,
        sensorId: sensor.id,
        alertType: 'battery_low',
        severity: reading.batteryLevel < 10 ? 'high' : 'medium',
        message: `${sensor.name}: Low battery level (${reading.batteryLevel}%)`,
        timestamp: reading.timestamp,
        acknowledged: false
      }

      this.alerts.push(alert)
    }
  }

  private static calculateStatistics(values: number[]) {
    if (values.length === 0) {
      return { average: 0, minimum: 0, maximum: 0, standardDeviation: 0 }
    }

    const average = values.reduce((sum, val) => sum + val, 0) / values.length
    const minimum = Math.min(...values)
    const maximum = Math.max(...values)

    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length
    const standardDeviation = Math.sqrt(variance)

    return { average, minimum, maximum, standardDeviation }
  }

  private static calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable'

    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length

    const change = ((secondAvg - firstAvg) / firstAvg) * 100

    if (change > 5) return 'increasing'
    if (change < -5) return 'decreasing'
    return 'stable'
  }

  private static detectAnomalies(readings: SensorReading[]) {
    // Simple anomaly detection based on z-score
    const values = readings.map((r) => r.value)
    const stats = this.calculateStatistics(values)
    const anomalies: SensorAnalytics['anomalies'] = []

    readings.forEach((reading) => {
      const zScore = Math.abs((reading.value - stats.average) / stats.standardDeviation)

      if (zScore > 2.5) {
        // Values more than 2.5 standard deviations away
        anomalies.push({
          timestamp: reading.timestamp,
          value: reading.value,
          type: reading.value > stats.average ? 'spike' : 'drop',
          severity: zScore > 3 ? 'critical' : zScore > 2.8 ? 'major' : 'minor'
        })
      }
    })

    return anomalies
  }

  private static generateSensorRecommendations(
    sensorId: string,
    statistics: any,
    readings: SensorReading[]
  ): string[] {
    const sensor = this.sensors.get(sensorId)
    if (!sensor) return []

    const recommendations: string[] = []
    const { average } = statistics

    switch (sensor.type) {
      case 'soil_moisture':
        if (average < sensor.thresholds.optimal.min) {
          recommendations.push('Increase irrigation frequency or duration')
        } else if (average > sensor.thresholds.optimal.max) {
          recommendations.push('Reduce irrigation to prevent waterlogging')
        }
        break

      case 'ph_level':
        if (average < 6.0) {
          recommendations.push('Apply lime to increase soil pH')
        } else if (average > 7.5) {
          recommendations.push('Apply sulfur or acidifying fertilizer to lower pH')
        }
        break

      case 'air_temperature':
        if (average > 35) {
          recommendations.push('Consider shade cloth or misting systems during hot periods')
        }
        break
    }

    return recommendations
  }

  private static calculateIrrigationDuration(currentMoisture: number, thresholds: any): number {
    const deficit = thresholds.optimal.min - currentMoisture
    return Math.max(15, Math.min(60, deficit * 2)) // 15-60 minutes
  }

  private static calculateNutrientConcentration(currentLevel: number): number {
    // Simple calculation based on deficit
    return Math.max(50, 200 - currentLevel) // 50-200 ppm
  }

  private static averageCurrentValue(
    sensors: SensorDevice[],
    readings: { [key: string]: SensorReading }
  ): number {
    const values = sensors
      .map((sensor) => readings[sensor.id]?.value)
      .filter((v) => v !== undefined)
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
  }
}

export default IoTSensorService
