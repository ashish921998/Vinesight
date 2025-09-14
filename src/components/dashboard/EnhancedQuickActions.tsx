'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Droplets,
  SprayCan,
  Scissors,
  DollarSign,
  Camera,
  Mic,
  MicOff,
  Plus,
  Beaker,
  TestTube,
  MapPin,
  Clock,
  CheckCircle,
} from 'lucide-react'

interface QuickAction {
  id: string
  title: string
  subtitle: string
  icon: React.ComponentType<any>
  color: string
  bgGradient: string
  oneTap?: boolean
  voiceEnabled?: boolean
  cameraEnabled?: boolean
  priority: number
}

interface EnhancedQuickActionsProps {
  onAction: (actionId: string, data?: any) => void
  onVoiceRecord?: (actionId: string) => void
  onCameraCapture?: (actionId: string) => void
  loading?: boolean
}

export function EnhancedQuickActions({
  onAction,
  onVoiceRecord,
  onCameraCapture,
  loading,
}: EnhancedQuickActionsProps) {
  const [showVoiceDialog, setShowVoiceDialog] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)

  const quickActions: QuickAction[] = [
    {
      id: 'irrigation',
      title: 'Log Irrigation',
      subtitle: 'Quick water log',
      icon: Droplets,
      color: 'bg-primary/20 text-primary',
      bgGradient: 'from-primary/10 to-primary/20',
      oneTap: true,
      voiceEnabled: true,
      cameraEnabled: true,
      priority: 1,
    },
    {
      id: 'spray',
      title: 'Spray Record',
      subtitle: 'Pest & disease',
      icon: SprayCan,
      color: 'bg-primary/20 text-primary',
      bgGradient: 'from-primary/10 to-primary/20',
      oneTap: true,
      voiceEnabled: true,
      cameraEnabled: true,
      priority: 2,
    },
    {
      id: 'harvest',
      title: 'Record Harvest',
      subtitle: 'Log yield data',
      icon: Scissors,
      color: 'bg-primary/20 text-primary',
      bgGradient: 'from-primary/10 to-primary/20',
      oneTap: true,
      voiceEnabled: true,
      priority: 3,
    },
    {
      id: 'expense',
      title: 'Add Expense',
      subtitle: 'Track costs',
      icon: DollarSign,
      color: 'bg-primary/20 text-primary',
      bgGradient: 'from-primary/10 to-primary/20',
      oneTap: false,
      voiceEnabled: true,
      priority: 4,
    },
    {
      id: 'fertigation',
      title: 'Fertigation',
      subtitle: 'Nutrient log',
      icon: Beaker,
      color: 'bg-primary/20 text-primary',
      bgGradient: 'from-primary/10 to-primary/20',
      oneTap: true,
      voiceEnabled: true,
      priority: 5,
    },
    {
      id: 'soil_test',
      title: 'Soil Test',
      subtitle: 'Record analysis',
      icon: TestTube,
      color: 'bg-primary/20 text-primary',
      bgGradient: 'from-primary/10 to-primary/20',
      oneTap: false,
      voiceEnabled: true,
      cameraEnabled: true,
      priority: 6,
    },
    {
      id: 'field_photo',
      title: 'Field Photo',
      subtitle: 'Capture issues',
      icon: Camera,
      color: 'bg-accent/20 text-accent-foreground',
      bgGradient: 'from-accent/10 to-accent/20',
      oneTap: true,
      cameraEnabled: true,
      priority: 7,
    },
    {
      id: 'voice_note',
      title: 'Voice Note',
      subtitle: 'Record memo',
      icon: Mic,
      color: 'bg-secondary/20 text-secondary-foreground',
      bgGradient: 'from-secondary/10 to-secondary/20',
      oneTap: true,
      voiceEnabled: true,
      priority: 8,
    },
  ]

  const handleActionClick = (action: QuickAction) => {
    if (action.oneTap) {
      onAction(action.id, {
        timestamp: new Date(),
        location: 'current', // GPS would be added here
        oneTap: true,
      })
      return
    }

    // Open detailed form/dialog for complex actions
    onAction(action.id)
  }

  const handleVoiceAction = (actionId: string) => {
    setShowVoiceDialog(actionId)
  }

  const startVoiceRecording = () => {
    setIsRecording(true)
    // Voice recording implementation would go here
    onVoiceRecord?.(showVoiceDialog!)

    // Simulate recording for demo
    setTimeout(() => {
      setIsRecording(false)
      setShowVoiceDialog(null)
    }, 3000)
  }

  const handleCameraAction = (actionId: string) => {
    onCameraCapture?.(actionId)
  }

  if (loading) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3" />
                <div className="w-16 h-4 bg-gray-200 rounded mx-auto mb-1" />
                <div className="w-12 h-3 bg-gray-200 rounded mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Quick Actions
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {quickActions
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 4)
            .map((action) => {
              const Icon = action.icon

              return (
                <Card
                  key={action.id}
                  className={`
                    border-0 shadow-sm hover:shadow-md transition-all duration-200 
                    active:scale-95 touch-manipulation cursor-pointer
                    bg-gradient-to-br ${action.bgGradient}
                    hover:scale-105 min-h-[120px]
                  `}
                  onClick={() => handleActionClick(action)}
                >
                  <CardContent className="p-3 text-center relative">
                    {/* One-tap indicator */}
                    {action.oneTap && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      </div>
                    )}

                    {/* Main action icon */}
                    <div
                      className={`
                      inline-flex items-center justify-center 
                      w-10 h-10 rounded-full mb-2
                      ${action.color}
                    `}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Action title and subtitle */}
                    <h3 className="font-semibold text-sm text-foreground mb-1">{action.title}</h3>
                    <p className="text-xs text-muted-foreground leading-tight mb-2">
                      {action.subtitle}
                    </p>

                    {/* Secondary action buttons */}
                    <div className="flex justify-center gap-2 mt-2">
                      {action.voiceEnabled && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-primary/20 touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVoiceAction(action.id)
                          }}
                        >
                          <Mic className="h-3 w-3" />
                        </Button>
                      )}

                      {action.cameraEnabled && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-primary/20 touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCameraAction(action.id)
                          }}
                        >
                          <Camera className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* One-tap success indicator */}
                    {action.oneTap && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                        <span className="text-xs text-primary font-medium">One-tap</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
        </div>

        {/* Quick location/time display */}
        <div className="mt-2 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="hidden sm:inline">Current Location</span>
            <span className="sm:hidden">Location</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Voice Recording Dialog */}
      <Dialog open={showVoiceDialog !== null} onOpenChange={() => setShowVoiceDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              Voice Recording
            </DialogTitle>
            <DialogDescription>
              Record details for {quickActions.find((a) => a.id === showVoiceDialog)?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="text-center py-6">
            {!isRecording ? (
              <div>
                <Button
                  size="lg"
                  onClick={startVoiceRecording}
                  className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90"
                >
                  <Mic className="h-6 w-6" />
                </Button>
                <p className="text-sm text-muted-foreground mt-3">Tap to start recording</p>
              </div>
            ) : (
              <div>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={() => {
                    setIsRecording(false)
                    setShowVoiceDialog(null)
                  }}
                  className="h-16 w-16 rounded-full animate-pulse"
                >
                  <MicOff className="h-6 w-6" />
                </Button>
                <p className="text-sm text-foreground mt-3 font-medium">Recording... Tap to stop</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
