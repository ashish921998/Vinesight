"use client";

import { TaskReminder } from '../types/types';
import { z } from 'zod'
import { createNamespacedStorage, StorageBackends, storageNamespaces } from './storage'

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  overdueTasks: boolean;
  upcomingTasks: boolean;
  reminderTime: string;
  daysAdvance: number;
}

const SettingsSchema = z.object({
  enabled: z.boolean(),
  dailyReminder: z.boolean(),
  overdueTasks: z.boolean(),
  upcomingTasks: z.boolean(),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/),
  daysAdvance: z.number().min(0).max(14)
})

const storage = createNamespacedStorage(storageNamespaces.notifications, StorageBackends.local)

function msUntilNextMidnight(): number {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return Math.max(0, tomorrow.getTime() - now.getTime())
}

export class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings;
  private notificationQueue: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.settings = this.loadSettings();
    this.requestPermission();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private loadSettings(): NotificationSettings {
    const def = this.getDefaultSettings()
    const saved = storage.get('settings', SettingsSchema)
    return saved ? { ...def, ...saved } : def
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      dailyReminder: true,
      overdueTasks: true,
      upcomingTasks: true,
      reminderTime: "09:00",
      daysAdvance: 1
    };
  }

  saveSettings(settings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...settings };
    storage.set('settings', this.settings, { schema: SettingsSchema })
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }
    
    return Notification.permission;
  }

  private canSendNotifications(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      this.settings.enabled
    );
  }

  sendNotification(title: string, options: NotificationOptions = {}): void {
    if (!this.canSendNotifications()) return;

    const notification = new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options
    });

    setTimeout(() => notification.close(), 10000);
  }

  sendTaskReminder(task: TaskReminder, type: 'due_today' | 'overdue' | 'upcoming'): void {
    if (!this.canSendNotifications()) return;

    let title: string;
    let body: string;
    let icon = '🔔';

    switch (type) {
      case 'due_today':
        title = `Task Due Today: ${task.title}`;
        body = `Don't forget to complete "${task.title}" today.`;
        icon = '📅';
        break;
      case 'overdue':
        title = `Overdue Task: ${task.title}`;
        body = `Task "${task.title}" was due on ${new Date(task.dueDate).toLocaleDateString()}.`;
        icon = '⚠️';
        break;
      case 'upcoming':
        const daysUntil = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        title = `Upcoming Task: ${task.title}`;
        body = `Task "${task.title}" is due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}.`;
        icon = '📋';
        break;
    }

    this.sendNotification(`${icon} ${title}`, {
      body,
      tag: `task-${task.id}`,
      data: { taskId: task.id, type }
    });
  }

  scheduleTaskNotifications(tasks: TaskReminder[]): void {
    this.clearScheduledNotifications();
    if (!this.settings.enabled) return;

    const now = new Date();
    
    tasks.forEach(task => {
      if (task.completed) return;

      const dueDate = new Date(task.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();
      const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      if (timeDiff < 0 && this.settings.overdueTasks) {
        setTimeout(() => { this.sendTaskReminder(task, 'overdue') }, 1000);
      }

      if (daysUntil === 0) {
        const [hour, minute] = this.settings.reminderTime.split(':').map(Number);
        const notifyTime = new Date(now);
        notifyTime.setHours(hour, minute, 0, 0);
        
        if (notifyTime > now) {
          const timeoutId = setTimeout(() => { this.sendTaskReminder(task, 'due_today') }, notifyTime.getTime() - now.getTime());
          this.notificationQueue.set(`task-${task.id}-today`, timeoutId);
        }
      }

      if (daysUntil === this.settings.daysAdvance && this.settings.upcomingTasks) {
        const [hour, minute] = this.settings.reminderTime.split(':').map(Number);
        const notifyTime = new Date(now);
        notifyTime.setDate(notifyTime.getDate() + daysUntil - this.settings.daysAdvance);
        notifyTime.setHours(hour, minute, 0, 0);
        
        if (notifyTime > now) {
          const timeoutId = setTimeout(() => { this.sendTaskReminder(task, 'upcoming') }, notifyTime.getTime() - now.getTime());
          this.notificationQueue.set(`task-${task.id}-upcoming`, timeoutId);
        }
      }
    });
  }

  scheduleDailyReminder(pendingTasksCount: number): void {
    if (!this.settings.dailyReminder || !this.canSendNotifications()) return;

    const now = new Date();
    const [hour, minute] = this.settings.reminderTime.split(':').map(Number);
    const reminderTime = new Date(now);
    reminderTime.setHours(hour, minute, 0, 0);
    
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeoutId = setTimeout(() => {
      if (pendingTasksCount > 0) {
        this.sendNotification('🍇 VineSight Daily Reminder', {
          body: `You have ${pendingTasksCount} pending farming task${pendingTasksCount === 1 ? '' : 's'}.`,
          tag: 'daily-reminder'
        });
      }
    }, reminderTime.getTime() - now.getTime());

    this.notificationQueue.set('daily-reminder', timeoutId);
  }

  clearScheduledNotifications(): void {
    this.notificationQueue.forEach((timeoutId) => { clearTimeout(timeoutId) });
    this.notificationQueue.clear();
  }

  sendWeatherAlert(message: string, priority: 'low' | 'medium' | 'high' = 'medium'): void {
    if (!this.canSendNotifications()) return;

    const icons = { low: '🌤️', medium: '⛈️', high: '🚨' } as const
    this.sendNotification(`${icons[priority]} Weather Alert`, {
      body: message,
      tag: 'weather-alert',
      requireInteraction: priority === 'high'
    });
  }

  sendTaskCompletionCelebration(task: TaskReminder): void {
    if (!this.canSendNotifications()) return;
    this.sendNotification('🎉 Task Completed!', {
      body: `Great job completing "${task.title}"!`,
      tag: 'task-completion'
    });
  }

  sendSeasonalReminder(season: string, tasks: string[]): void {
    if (!this.canSendNotifications() || tasks.length === 0) return;
    this.sendNotification(`🍇 ${season} Season Tasks`, {
      body: `Important ${season.toLowerCase()} tasks: ${tasks.slice(0, 3).join(', ')}${tasks.length > 3 ? '...' : ''}`,
      tag: 'seasonal-reminder'
    });
  }

  sendWaterLevelAlert(farmName: string, waterLevel: number, alertType: 'critical' | 'low' | 'medium'): void {
    if (!this.canSendNotifications()) return;

    let title: string;
    let body: string;
    let priority: boolean = false;

    switch (alertType) {
      case 'critical':
        title = '🚨 URGENT: Critical Water Level';
        body = `${farmName}: Only ${waterLevel.toFixed(1)}mm water remaining. IRRIGATION NEEDED IMMEDIATELY!`;
        priority = true;
        break;
      case 'low':
        title = '⚠️ Low Water Level Alert';
        body = `${farmName}: Water level is low (${waterLevel.toFixed(1)}mm). Consider irrigation soon.`;
        break;
      case 'medium':
        title = '💧 Water Level Notice';
        body = `${farmName}: Water level is moderate (${waterLevel.toFixed(1)}mm). Monitor closely.`;
        break;
    }

    this.sendNotification(title, {
      body,
      tag: `water-level-${alertType}`,
      requireInteraction: priority,
      data: { 
        type: 'water-alert', 
        alertType, 
        waterLevel, 
        farmName,
        timestamp: new Date().toISOString()
      }
    });
  }

  checkWaterLevelAndAlert(farmName: string, waterLevel: number): void {
    if (!this.canSendNotifications()) return;

    if (waterLevel < 6) {
      this.sendWaterLevelAlert(farmName, waterLevel, 'critical');
    } else if (waterLevel < 10) {
      this.sendWaterLevelAlert(farmName, waterLevel, 'low');
    } else if (waterLevel < 25) {
      const last = storage.get<string>('last_medium_alert_day')
      const today = new Date().toDateString()
      if (last !== today) {
        this.sendWaterLevelAlert(farmName, waterLevel, 'medium');
        storage.set('last_medium_alert_day', today, { ttlMs: msUntilNextMidnight() })
      }
    }
  }
}
