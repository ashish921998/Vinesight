'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Clock,
  Calendar,
  AlertCircle,
  TrendingUp,
  Droplets,
  Spray,
  Scissors,
  Flask,
  Package,
  FileText,
  Brain
} from 'lucide-react'
import { SmartTaskGenerator } from '@/lib/smart-task-generator'
import { SupabaseService } from '@/lib/supabase-service'
import { type AITaskRecommendation } from '@/types/ai'
import { type Farm } from '@/types/types'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { capitalize } from '@/lib/utils'
import { TaskRecommendationCard } from '@/components/ai/TaskRecommendationCard'

export default function AITasksPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useSupabaseAuth()
  const farmId = params.id as string

  const [farm, setFarm] = useState<Farm | null>(null)
  const [tasks, setTasks] = useState<AITaskRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

  const loadFarm = useCallback(async () => {
    try {
      const farmData = await SupabaseService.getDashboardSummary(parseInt(farmId))
      setFarm(farmData.farm)
    } catch (error) {
      console.error('Error loading farm:', error)
    }
  }, [farmId])

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const activeTasks = await SmartTaskGenerator.getActiveRecommendations(parseInt(farmId))
      setTasks(activeTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [farmId])

  const generateNewTasks = useCallback(async () => {
    if (!user?.id) return

    try {
      setGenerating(true)
      const result = await SmartTaskGenerator.generateSmartTasks({
        farmId: parseInt(farmId),
        userId: user.id,
        options: {
          regenerate: true,
          daysAhead: 7
        }
      })

      if (result.success) {
        // Reload tasks to show newly generated ones
        await loadTasks()
      }
    } catch (error) {
      console.error('Error generating tasks:', error)
    } finally {
      setGenerating(false)
    }
  }, [farmId, user?.id, loadTasks])

  useEffect(() => {
    loadFarm()
    loadTasks()
  }, [loadFarm, loadTasks])

  const handleBack = () => {
    router.push(`/farms/${farmId}`)
  }

  const getTaskIcon = (taskType: string) => {
    const icons = {
      irrigation: Droplets,
      spray: Spray,
      harvest: Package,
      fertigation: Droplets,
      pruning: Scissors,
      soil_test: Flask,
      petiole_test: Flask,
      expense: FileText,
      note: FileText
    }
    return icons[taskType as keyof typeof icons] || CheckCircle2
  }

  const getPriorityBadge = (priorityScore: number) => {
    if (priorityScore >= 0.8) return { label: 'High', variant: 'destructive' as const }
    if (priorityScore >= 0.5) return { label: 'Medium', variant: 'default' as const }
    return { label: 'Low', variant: 'secondary' as const }
  }

  const getFilteredTasks = () => {
    if (selectedFilter === 'all') return tasks
    return tasks.filter((task) => task.taskType === selectedFilter)
  }

  const getTaskTypeCount = (taskType: string) => {
    return tasks.filter((task) => task.taskType === taskType).length
  }

  const highPriorityCount = tasks.filter((task) => task.priorityScore >= 0.8).length
  const todayTasks = tasks.filter((task) => {
    const today = new Date()
    const taskDate = new Date(task.recommendedDate)
    return (
      taskDate.getDate() === today.getDate() &&
      taskDate.getMonth() === today.getMonth() &&
      taskDate.getFullYear() === today.getFullYear()
    )
  }).length

  const upcomingTasks = tasks.filter((task) => {
    const today = new Date()
    const taskDate = new Date(task.recommendedDate)
    const diffTime = taskDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 && diffDays <= 7
  }).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-48 h-5 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="w-full h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 h-32 animate-pulse">
                <div className="w-full h-full bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                AI Task Recommendations
              </h1>
              <p className="text-sm text-gray-600">
                {farm?.name ? capitalize(farm.name) : `Farm ${farmId}`} • Smart farming assistant
              </p>
            </div>
            <div className="flex items-center gap-2">
              {highPriorityCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {highPriorityCount} High Priority
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={generateNewTasks}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Generate Tasks
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
                  <div className="text-sm text-gray-600">Active Recommendations</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{todayTasks}</div>
                  <div className="text-sm text-gray-600">Today's Tasks</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{upcomingTasks}</div>
                  <div className="text-sm text-gray-600">This Week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI-Powered Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-700">
              These tasks are generated based on weather forecasts, farm history, pest predictions,
              and your personalized farming profile. Accept tasks to add them to your journal or
              provide feedback to help improve future recommendations.
            </p>
          </CardContent>
        </Card>

        {/* Task Type Filters */}
        <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-9">
              <TabsTrigger value="all" className="text-xs">
                All ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="irrigation" className="text-xs">
                Irrigation ({getTaskTypeCount('irrigation')})
              </TabsTrigger>
              <TabsTrigger value="spray" className="text-xs">
                Spray ({getTaskTypeCount('spray')})
              </TabsTrigger>
              <TabsTrigger value="fertigation" className="text-xs">
                Fertigation ({getTaskTypeCount('fertigation')})
              </TabsTrigger>
              <TabsTrigger value="harvest" className="text-xs">
                Harvest ({getTaskTypeCount('harvest')})
              </TabsTrigger>
              <TabsTrigger value="pruning" className="text-xs">
                Pruning ({getTaskTypeCount('pruning')})
              </TabsTrigger>
              <TabsTrigger value="soil_test" className="text-xs">
                Soil Test ({getTaskTypeCount('soil_test')})
              </TabsTrigger>
              <TabsTrigger value="petiole_test" className="text-xs">
                Petiole Test ({getTaskTypeCount('petiole_test')})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tasks List */}
          <TabsContent value={selectedFilter} className="space-y-3">
            {getFilteredTasks().length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">All Caught Up!</h3>
                  <p className="text-gray-600 mb-4">
                    {selectedFilter === 'all'
                      ? 'No active task recommendations at this time.'
                      : `No ${selectedFilter} tasks recommended right now.`}
                  </p>
                  <Button onClick={generateNewTasks} disabled={generating}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate New Recommendations
                  </Button>
                </CardContent>
              </Card>
            ) : (
              getFilteredTasks()
                .sort((a, b) => b.priorityScore - a.priorityScore)
                .map((task) => (
                  <TaskRecommendationCard
                    key={task.id}
                    task={task}
                    onAccept={async () => {
                      await SmartTaskGenerator.updateTaskStatus(task.id, 'accepted')
                      await loadTasks()
                    }}
                    onReject={async (feedback) => {
                      await SmartTaskGenerator.updateTaskStatus(task.id, 'rejected', feedback)
                      await loadTasks()
                    }}
                    onComplete={async (feedback) => {
                      await SmartTaskGenerator.updateTaskStatus(task.id, 'completed', feedback)
                      await loadTasks()
                    }}
                  />
                ))
            )}
          </TabsContent>
        </Tabs>

        {/* Help Footer */}
        {tasks.length > 0 && (
          <Card className="mt-6 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    How Task Recommendations Work
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>
                      • <strong>Priority Score:</strong> Indicates urgency (High, Medium, Low)
                    </li>
                    <li>
                      • <strong>Confidence Score:</strong> AI's certainty about the recommendation
                    </li>
                    <li>
                      • <strong>Weather Dependent:</strong> Task timing is affected by weather
                      conditions
                    </li>
                    <li>
                      • <strong>Feedback:</strong> Your input helps improve future recommendations
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
