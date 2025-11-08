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
import { Switch } from '@/components/ui/switch'
import {
  NotificationService,
  NotificationSettings as INotificationSettings
} from '@/lib/notification-service'
import { Bell, Clock, AlertTriangle, Calendar, Settings, CheckCircle2 } from 'lucide-react'

interface NotificationSettingsProps {
  onClose: () => void
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<INotificationSettings>({
    enabled: true,
    dailyReminder: true,
    overdueTasks: true,
    upcomingTasks: true,
    reminderTime: '09:00',
    daysAdvance: 1
  })
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [saved, setSaved] = useState(false)

  const notificationService = NotificationService.getInstance()

  useEffect(() => {
    // Load current settings
    const currentSettings = notificationService.getSettings()
    setSettings(currentSettings)

    // Check permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const handlePermissionRequest = async () => {
    const newPermission = await notificationService.requestPermission()
    setPermission(newPermission)
  }

  const handleSettingChange = (
    key: keyof INotificationSettings,
    value: boolean | string | number
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value
    }))
    setSaved(false)
  }

  const handleSave = () => {
    notificationService.saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const testNotification = () => {
    notificationService.sendNotification('🍇 Test Notification', {
      body: 'VineSight notifications are working correctly!',
      tag: 'test-notification'
    })
  }

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return {
          color: 'text-green-600',
          icon: <CheckCircle2 className="h-4 w-4" />,
          text: 'Notifications Enabled'
        }
      case 'denied':
        return {
          color: 'text-red-600',
          icon: <AlertTriangle className="h-4 w-4" />,
          text: 'Notifications Blocked'
        }
      default:
        return {
          color: 'text-orange-600',
          icon: <Bell className="h-4 w-4" />,
          text: 'Permission Required'
        }
    }
  }

  const permissionStatus = getPermissionStatus()

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>Configure when and how you receive farming task reminders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={permissionStatus.color}>{permissionStatus.icon}</span>
                <div>
                  <h4 className="font-medium">Browser Notifications</h4>
                  <p className={`text-sm ${permissionStatus.color}`}>{permissionStatus.text}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {permission !== 'granted' && (
                  <Button size="sm" onClick={handlePermissionRequest} variant="outline">
                    Enable Notifications
                  </Button>
                )}
                {permission === 'granted' && (
                  <Button size="sm" onClick={testNotification} variant="outline">
                    Test Notification
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Turn on/off all VineSight notifications
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
            />
          </div>

          {settings.enabled && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Daily Reminder
                  </Label>
                  <p className="text-sm text-muted-foreground">Daily summary of pending tasks</p>
                </div>
                <Switch
                  checked={settings.dailyReminder}
                  onCheckedChange={(checked) => handleSettingChange('dailyReminder', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Overdue Tasks
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notify about tasks past their due date
                  </p>
                </div>
                <Switch
                  checked={settings.overdueTasks}
                  onCheckedChange={(checked) => handleSettingChange('overdueTasks', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Upcoming Tasks
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Advanced notice for upcoming tasks
                  </p>
                </div>
                <Switch
                  checked={settings.upcomingTasks}
                  onCheckedChange={(checked) => handleSettingChange('upcomingTasks', checked)}
                />
              </div>

              {/* Timing Settings */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label htmlFor="reminderTime">Daily Reminder Time</Label>
                  <Input
                    id="reminderTime"
                    type="time"
                    value={settings.reminderTime}
                    onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="daysAdvance">Days in Advance</Label>
                  <Select
                    value={settings.daysAdvance.toString()}
                    onValueChange={(newValue) =>
                      handleSettingChange('daysAdvance', parseInt(newValue))
                    }
                  >
                    <SelectTrigger id="daysAdvance">
                      <SelectValue placeholder="Select days in advance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Day</SelectItem>
                      <SelectItem value="2">2 Days</SelectItem>
                      <SelectItem value="3">3 Days</SelectItem>
                      <SelectItem value="7">1 Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleSave} className={saved ? 'bg-green-600 hover:bg-green-700' : ''}>
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
