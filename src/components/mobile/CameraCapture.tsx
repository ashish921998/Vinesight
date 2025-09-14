'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, X, Check, RotateCcw } from 'lucide-react'
import Image from 'next/image'

interface CameraCaptureProps {
  onPhotoCapture: (photoBlob: Blob, photoUrl: string) => void
  onClose: () => void
  title?: string
  maxWidth?: number
  maxHeight?: number
}

export function CameraCapture({
  onPhotoCapture,
  onClose,
  title = 'Capture Photo',
  maxWidth = 1024,
  maxHeight = 768,
}: CameraCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: maxWidth },
          height: { ideal: maxHeight },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)
      }
    } catch (error) {
      console.error('Camera access denied:', error)
      alert('Camera access is required to take photos. Please enable camera permissions.')
    }
  }, [facingMode, maxWidth, maxHeight])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    context.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const photoUrl = canvas.toDataURL('image/jpeg', 0.8)
          setCapturedPhoto(photoUrl)
          stopCamera()
        }
      },
      'image/jpeg',
      0.8,
    )
  }, [stopCamera])

  const confirmPhoto = useCallback(() => {
    if (!capturedPhoto || !canvasRef.current) return

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          onPhotoCapture(blob, capturedPhoto)
          onClose()
        }
      },
      'image/jpeg',
      0.8,
    )
  }, [capturedPhoto, onPhotoCapture, onClose])

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null)
    startCamera()
  }, [startCamera])

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
    if (isStreaming) {
      stopCamera()
      setTimeout(() => startCamera(), 100)
    }
  }, [isStreaming, stopCamera, startCamera])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col lg:hidden">
      <Card className="flex-1 rounded-none border-0 bg-black text-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">{title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 relative">
          {!capturedPhoto ? (
            <>
              <div className="relative w-full h-full flex items-center justify-center">
                {isStreaming ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6">
                    <Camera className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-gray-300 mb-4">
                      Capture photos of crops, diseases, or farm conditions
                    </p>
                    <Button
                      onClick={startCamera}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                )}
              </div>

              {isStreaming && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={switchCamera}
                    className="text-white bg-black bg-opacity-50 hover:bg-opacity-70"
                  >
                    <RotateCcw className="h-6 w-6" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white text-black hover:bg-gray-200"
                  >
                    <Camera className="h-8 w-8" />
                  </Button>
                  <div className="w-12" /> {/* Spacer for symmetry */}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <Image
                  src={capturedPhoto}
                  alt="Captured photo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="flex justify-center gap-4 p-6">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="flex-1 bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={confirmPhoto}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Use Photo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
