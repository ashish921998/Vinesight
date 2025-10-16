'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Settings,
  Sparkles,
  Target
} from 'lucide-react'
import { CloudDataService, Task } from '@/lib/cloud-data-service'
import type { Farm, TaskPriority, TaskStatus } from '@/types/types'
import { SupabaseService } from '@/lib/supabase-service'
import { TaskTemplateSelector } from '@/components/reminders/TaskTemplateSelector'
import { NotificationSettings } from '@/components/reminders/NotificationSettings'
import { NotificationService } from '@/lib/notification-service'
import { getCurrentSeasonTemplates } from '@/lib/task-templates'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function RemindersPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all')
  const [showSeasonalSuggestions, setShowSeasonalSuggestions] = useState(true)
  const [farmsLoading, setFarmsLoading] = useState(true)

  const notificationServiceRef = useRef<NotificationService | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    category: 'other',
    priority: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus
  })

  const loadFarms = useCallback(async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Reminders: Loading farms from CloudDataService...')
      }
      const farmList = await CloudDataService.getAllFarms()
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Reminders: Loaded farms:', farmList.length, farmList)
      }
      setFarms(farmList)
      if (farmList.length > 0 && !selectedFarm) {
        setSelectedFarm(farmList[0])
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error loading farms:', error)
      }
    } finally {
      setFarmsLoading(false)
    }
  }, [selectedFarm])

  const loadTasks = useCallback(async () => {
    if (!selectedFarm) return

    try {
      const taskList = await SupabaseService.getTasks({
        farmId: selectedFarm.id!,
        includeCompleted: true,
        orderBy: 'due_date'
      })
      setTasks(taskList)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error loading tasks:', error)
      }
    }
  }, [selectedFarm])

  useEffect(() => {
    loadFarms()
    // Initialize notification service
    if (typeof window !== 'undefined') {
      notificationServiceRef.current = NotificationService.getInstance()
    }
  }, [loadFarms])

  useEffect(() => {
    if (selectedFarm) {
      loadTasks()
    }
  }, [selectedFarm, loadTasks])

  useEffect(() => {
    // Set up notifications when tasks change
    if (notificationServiceRef.current && tasks.length > 0) {
      notificationServiceRef.current.scheduleTaskNotifications(tasks)
      const pendingCount = tasks.filter((t) => !t.completed).length
      notificationServiceRef.current.scheduleDailyReminder(pendingCount)
    }
  }, [tasks])

  // Functions moved to useCallback above

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarm) return

    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        dueDate: formData.dueDate,
        priority: formData.priority,
        category: formData.category,
        status: formData.status
      }

      if (editingTask) {
        await SupabaseService.updateTask(editingTask.id, payload)
      } else {
        await SupabaseService.createTask({
          ...payload,
          farmId: selectedFarm.id!
        })
      }

      resetForm()
      await loadTasks()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error saving task:', error)
      }
    }
  }

  const handleComplete = async (taskId: number) => {
    try {
      await SupabaseService.completeTask(taskId)
      const completedTask = tasks.find((t) => t.id === taskId)
      if (completedTask && notificationServiceRef.current) {
        notificationServiceRef.current.sendTaskCompletionCelebration(completedTask)
      }
      await loadTasks()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error completing task:', error)
      }
    }
  }

  const handleTemplateSelect = async (templateData: any) => {
    if (!selectedFarm) return

    try {
      await SupabaseService.addTaskReminder({
        farmId: selectedFarm.id!,
        title: templateData.title,
        description: templateData.description,
        dueDate: templateData.dueDate,
        type: templateData.type,
        priority: templateData.priority,
        completed: false,
        completedAt: null
      })

      setShowTemplateSelector(false)
      await loadTasks()

      if (notificationServiceRef.current) {
        notificationServiceRef.current.sendNotification('✅ Task Created!', {
          body: `"${templateData.title}" has been added to your farm tasks.`,
          tag: 'task-created'
        })
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error saving task from template:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      type: 'other',
      priority: 'medium'
    })
    setShowAddForm(false)
    setEditingTask(null)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const getFilteredTasks = () => {
    const now = new Date()
    now.setHours(23, 59, 59, 999) // End of today

    return tasks.filter((task) => {
      switch (filter) {
        case 'pending':
          return !task.completed
        case 'completed':
          return task.completed
        case 'overdue':
          return !task.completed && new Date(task.dueDate) < now
        default:
          return true
      }
    })
  }

  const getPriorityColor = (priority: string | null) => {
    if (!priority) return 'border-gray-300 text-gray-500'
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-gray-200'
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'irrigation':
        return '💧'
      case 'spray':
        return '🌿'
      case 'fertigation':
        return '🧪'
      case 'training':
        return '✂️'
      case 'harvest':
        return '🍇'
      default:
        return '📋'
    }
  }

  const isOverdue = (dueDate: string) => {
    const now = new Date()
    now.setHours(23, 59, 59, 999)
    return new Date(dueDate) < now
  }

  const filteredTasks = getFilteredTasks()
  const pendingTasks = tasks.filter((t) => !t.completed)
  const overdueTasks = tasks.filter((t) => !t.completed && isOverdue(t.dueDate))

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Reminders & Tasks
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage farming schedules and get notified about important activities
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNotificationSettings(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Notifications
            </Button>
            <Button
              onClick={() => setShowTemplateSelector(true)}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Smart Templates
            </Button>
            <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Custom Task
            </Button>
          </div>
        </div>

        {/* Seasonal Suggestions */}
        {farms.length > 0 && showSeasonalSuggestions && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Seasonal Task Recommendations
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowSeasonalSuggestions(false)}>
                  ✕
                </Button>
              </div>
              <CardDescription>Important farming tasks for the current season</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getCurrentSeasonTemplates()
                  .slice(0, 6)
                  .map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-primary/10"
                    >
                      <span className="text-2xl">
                        {template.type === 'irrigation'
                          ? '💧'
                          : template.type === 'spray'
                            ? '🌿'
                            : template.type === 'training'
                              ? '✂️'
                              : template.type === 'harvest'
                                ? '🍇'
                                : '📋'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{template.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {template.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowTemplateSelector(true)
                          setShowSeasonalSuggestions(false)
                        }}
                        className="shrink-0"
                      >
                        Add
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        {farms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingTasks.length}</div>
                <p className="text-xs text-muted-foreground">{overdueTasks.length} overdue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasks.filter((t) => t.completed).length}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Farm Selection */}
        {farms.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Select Farm</CardTitle>
              <CardDescription>Choose a farm to view and manage tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {farms.map((farm) => (
                  <Button
                    key={farm.id}
                    variant={selectedFarm?.id === farm.id ? 'default' : 'outline'}
                    onClick={() => setSelectedFarm(farm)}
                  >
                    {farm.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedFarm && (
          <>
            {/* Add/Edit Task Form */}
            {showAddForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</CardTitle>
                  <CardDescription>Create a reminder for {selectedFarm.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Task Title</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="e.g., Winter Pruning"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => handleInputChange('dueDate', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">Task Type</Label>
                        <select
                          id="type"
                          value={formData.type}
                          onChange={(e) => handleInputChange('type', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="irrigation">Irrigation</option>
                          <option value="spray">Spray Treatment</option>
                          <option value="fertigation">Fertigation</option>
                          <option value="training">Training/Pruning</option>
                          <option value="harvest">Harvest</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <select
                          id="priority"
                          value={formData.priority}
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description (optional)</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Additional details about this task"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit">{editingTask ? 'Update Task' : 'Add Task'}</Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Filter Controls */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All ({tasks.length})
                  </Button>
                  <Button
                    variant={filter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('pending')}
                  >
                    Pending ({pendingTasks.length})
                  </Button>
                  <Button
                    variant={filter === 'overdue' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('overdue')}
                  >
                    Overdue ({overdueTasks.length})
                  </Button>
                  <Button
                    variant={filter === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('completed')}
                  >
                    Completed ({tasks.filter((t) => t.completed).length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tasks List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Tasks for {selectedFarm.name}
                </CardTitle>
                <CardDescription>{filteredTasks.length} tasks shown</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTasks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`border rounded-lg p-4 ${
                          task.completed
                            ? 'bg-gray-50 opacity-75'
                            : isOverdue(task.dueDate)
                              ? 'bg-red-50 border-red-200'
                              : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{getTaskTypeIcon(task.type)}</span>
                              <h3
                                className={`font-semibold ${task.completed ? 'line-through text-gray-500' : ''}`}
                              >
                                {task.title}
                              </h3>
                              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                {task.priority} priority
                              </Badge>
                              {isOverdue(task.dueDate) && !task.completed && (
                                <Badge
                                  variant="outline"
                                  className="text-red-600 bg-red-50 border-red-200"
                                >
                                  Overdue
                                </Badge>
                              )}
                            </div>

                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {task.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                              <Badge variant="outline">{task.type}</Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!task.completed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleComplete(task.id!)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            {task.completed && (
                              <Badge className="text-green-600 bg-green-50 border-green-200">
                                ✓ Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first farming task to get organized
                    </p>
                    <Button onClick={() => setShowAddForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {farmsLoading ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span>Loading farms...</span>
              </div>
            </CardContent>
          </Card>
        ) : farms.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No farms found</h3>
              <p className="text-muted-foreground mb-4">
                Add a farm first to start managing tasks and reminders
              </p>
              <Button onClick={() => (window.location.href = '/farms')}>Add Your First Farm</Button>
            </CardContent>
          </Card>
        ) : null}

        {/* Template Selector Modal */}
        {showTemplateSelector && selectedFarm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
              <TaskTemplateSelector
                selectedFarmName={selectedFarm.name}
                onSelectTemplate={handleTemplateSelect}
                onCancel={() => setShowTemplateSelector(false)}
              />
            </div>
          </div>
        )}

        {/* Notification Settings Modal */}
        {showNotificationSettings && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
