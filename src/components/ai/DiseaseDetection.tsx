'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, Loader2, CheckCircle, AlertTriangle, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIService, DiseaseDetectionResult, ImageAnalysisResult } from '@/lib/ai-service';
import { cn } from '@/lib/utils';

interface DiseaseDetectionProps {
  farmId?: string;
  onAnalysisComplete?: (result: ImageAnalysisResult) => void;
  className?: string;
}

export function DiseaseDetection({ farmId, onAnalysisComplete, className }: DiseaseDetectionProps) {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Camera constraints optimized for mobile
  const videoConstraints = {
    width: isMobile ? 480 : 640,
    height: isMobile ? 640 : 480,
    facingMode: 'environment', // Use back camera on mobile
  };

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setCameraMode(false);
        analyzeImage(imageSrc);
      }
    }
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageSrc = e.target?.result as string;
        setCapturedImage(imageSrc);
        analyzeImage(imageSrc);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const analyzeImage = async (imageSrc: string) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Create image element for analysis
      const img = new Image();
      img.onload = async () => {
        try {
          const analysisResult = await AIService.analyzeImage(img);
          setResult(analysisResult);
          onAnalysisComplete?.(analysisResult);
        } catch (err) {
          setError('Failed to analyze image. Please try again.');
          console.error('Analysis error:', err);
        } finally {
          setIsAnalyzing(false);
        }
      };
      img.src = imageSrc;
    } catch (err) {
      setError('Failed to process image. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setCapturedImage(null);
    setCameraMode(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
      case 'low':
        return <Info className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            AI Disease Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          {!cameraMode && !capturedImage && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => setCameraMode(true)}
                className="w-full"
                size={isMobile ? "lg" : "default"}
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
                size={isMobile ? "lg" : "default"}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
            </div>
          )}

          {/* Camera Interface */}
          {cameraMode && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-square sm:aspect-video">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={capturePhoto}
                  size={isMobile ? "lg" : "default"}
                  className="flex-1 max-w-xs"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </Button>
                <Button
                  onClick={() => setCameraMode(false)}
                  variant="outline"
                  size={isMobile ? "lg" : "default"}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Captured Image */}
          {capturedImage && (
            <div className="space-y-4">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square sm:aspect-video">
                <img
                  src={capturedImage}
                  alt="Captured for analysis"
                  className="w-full h-full object-cover"
                />
              </div>
              {!result && !isAnalyzing && (
                <Button onClick={reset} variant="outline" className="w-full">
                  Take Another Photo
                </Button>
              )}
            </div>
          )}

          {/* Analysis Loading */}
          {isAnalyzing && (
            <Alert>
              <Loader2 className="w-4 h-4 animate-spin" />
              <AlertDescription>
                Analyzing image... This may take a few seconds.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Analysis Results */}
          {result && (
            <div className="space-y-4">
              {/* Disease Detection Results */}
              {result.diseaseDetection && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      {getSeverityIcon(result.diseaseDetection.severity)}
                      Disease Detection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-semibold text-sm sm:text-base">
                        {result.diseaseDetection.disease}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(result.diseaseDetection.severity) as any}>
                          {result.diseaseDetection.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {(result.diseaseDetection.confidence * 100).toFixed(1)}% confidence
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      {result.diseaseDetection.description}
                    </p>

                    {result.diseaseDetection.treatment.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Recommended Treatment:</h4>
                        <ul className="space-y-1">
                          {result.diseaseDetection.treatment.map((treatment, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              {treatment}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.diseaseDetection.preventionTips.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Prevention Tips:</h4>
                        <ul className="space-y-1">
                          {result.diseaseDetection.preventionTips.slice(0, 3).map((tip, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Plant Health Analysis */}
              {result.plantHealth && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Plant Health Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Overall Health</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                              style={{ width: `${result.plantHealth.overallHealth}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {result.plantHealth.overallHealth.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Leaf Condition</h4>
                        <Badge variant="outline">{result.plantHealth.leafColor}</Badge>
                      </div>
                    </div>
                    
                    {result.plantHealth.leafDamage > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Leaf Damage</h4>
                        <span className="text-sm">
                          {result.plantHealth.leafDamage.toFixed(1)}% of leaf area affected
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Grape Analysis */}
              {(result.grapeClusterCount || result.berrySize || result.ripeness) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Grape Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      {result.grapeClusterCount && (
                        <div>
                          <h4 className="font-semibold mb-1">Cluster Count</h4>
                          <Badge variant="outline">{result.grapeClusterCount} clusters</Badge>
                        </div>
                      )}
                      {result.berrySize && (
                        <div>
                          <h4 className="font-semibold mb-1">Berry Size</h4>
                          <Badge variant="outline">{result.berrySize}</Badge>
                        </div>
                      )}
                      {result.ripeness && (
                        <div>
                          <h4 className="font-semibold mb-1">Ripeness</h4>
                          <Badge variant="outline">{result.ripeness}</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button onClick={reset} variant="outline" className="w-full">
                Analyze Another Image
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </CardContent>
      </Card>
    </div>
  );
}