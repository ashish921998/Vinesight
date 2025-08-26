import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Droplets } from 'lucide-react';
import type { ETcResults } from '@/lib/etc-calculator';

interface ResultsDisplayProps {
  results: ETcResults;
  date: string;
}

export function ResultsDisplay({ results, date }: ResultsDisplayProps) {
  return (
    <div id="results-section" className="mx-4">
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg text-green-800">ETc Results</CardTitle>
            </div>
            <Badge 
              variant={results.confidence === 'high' ? 'default' : results.confidence === 'medium' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {results.confidence.toUpperCase()} CONFIDENCE
            </Badge>
          </div>
          <CardDescription className="text-green-700 text-sm">
            Evapotranspiration and irrigation recommendations for {date}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 text-center border border-green-200">
              <div className="text-2xl font-bold text-green-700">{results.eto.toFixed(2)}</div>
              <div className="text-xs font-medium text-green-600">ETo (mm/day)</div>
              <div className="text-xs text-gray-600">Reference ET</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-green-200">
              <div className="text-2xl font-bold text-blue-700">{results.etc.toFixed(2)}</div>
              <div className="text-xs font-medium text-blue-600">ETc (mm/day)</div>
              <div className="text-xs text-gray-600">Crop ET</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 text-center border border-green-200">
              <div className="text-2xl font-bold text-purple-700">{results.kc.toFixed(2)}</div>
              <div className="text-xs font-medium text-purple-600">Kc</div>
              <div className="text-xs text-gray-600">Crop Coefficient</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-green-200">
              <div className="text-2xl font-bold text-orange-700">{results.irrigationNeed.toFixed(2)}</div>
              <div className="text-xs font-medium text-orange-600">Need (mm)</div>
              <div className="text-xs text-gray-600">After Rainfall</div>
            </div>
          </div>

          {/* Irrigation Recommendation */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Irrigation Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-blue-600 text-white text-sm">
                      {results.irrigationRecommendation.shouldIrrigate ? 'IRRIGATE' : 'NO IRRIGATION'}
                    </Badge>
                  </div>
                  {results.irrigationRecommendation.shouldIrrigate && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{results.irrigationRecommendation.duration.toFixed(2)} hours</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Frequency:</span>
                        <span className="font-medium">{results.irrigationRecommendation.frequency}</span>
                      </div>
                    </div>
                  )}
                </div>
                {results.irrigationRecommendation.notes && results.irrigationRecommendation.notes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-800 text-sm mb-2">Additional Notes:</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      {results.irrigationRecommendation.notes.map((note, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}