export const WEATHER_THRESHOLDS = {
  RAIN_MM: 0.5,
  HIGH_HUMIDITY_PERCENT: 80
} as const

export type WeatherThresholdKey = keyof typeof WEATHER_THRESHOLDS
