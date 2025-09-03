"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Droplets, 
  SprayCan,
  Scissors,
  FlaskConical,
  Settings,
  TrendingUp,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Brain,
  Zap,
  CloudRain
} from 'lucide-react';
import { SmartTaskGenerator } from '@/lib/smart-task-generator';
import type { AITaskRecommendation, RecommendationRequest } from '@/lib/types/ai-types';

interface SmartTasksDashboardProps {
  farmId: number;
  userId: string;
  className?: string;
}

export function SmartTasksDashboard({ farmId, userId, className }: SmartTasksDashboardProps) {
  const [recommendations, setRecommendations] = useState<AITaskRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingNew, setGeneratingNew] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [farmId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const activeRecommendations = await SmartTaskGenerator.getActiveRecommendations(farmId);
      setRecommendations(activeRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewRecommendations = async () => {
    try {
      setGeneratingNew(true);
      
      const request: RecommendationRequest = {
        farmId,
        userId,
        context: {
          currentWeather: undefined, // Will be fetched by the service
          growthStage: undefined, // Will be determined by the service
          recentActivities: [], // Will be fetched by the service
          availableResources: [],
          farmConditions: {}
        }
      };

      const result = await SmartTaskGenerator.generateSmartTasks(request);
      
      if (result.success && result.data) {
        // Refresh the recommendations list
        await loadRecommendations();
      }
    } catch (error) {
      console.error('Error generating new recommendations:', error);
    } finally {
      setGeneratingNew(false);
    }
  };

  const handleTaskAction = async (taskId: string, action: 'accepted' | 'rejected' | 'completed', feedback?: string) => {
    try {
      await SmartTaskGenerator.updateTaskStatus(taskId, action, feedback);
      await loadRecommendations(); // Refresh the list
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'irrigation': return <Droplets className="h-5 w-5 text-blue-600" />;
      case 'spray': return <SprayCan className="h-5 w-5 text-orange-600" />;
      case 'harvest': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'fertigation': return <FlaskConical className="h-5 w-5 text-purple-600" />;
      case 'pruning': return <Scissors className="h-5 w-5 text-red-600" />;
      case 'soil_test': return <Settings className="h-5 w-5 text-gray-600" />;
      default: return <Calendar className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priorityScore: number) => {
    if (priorityScore >= 0.8) return 'text-red-600 bg-red-50 border-red-200';
    if (priorityScore >= 0.6) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (priorityScore >= 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getPriorityLabel = (priorityScore: number) => {
    if (priorityScore >= 0.8) return 'CRITICAL';
    if (priorityScore >= 0.6) return 'HIGH';
    if (priorityScore >= 0.4) return 'MEDIUM';
    return 'LOW';
  };

  const formatTaskType = (taskType: string) => {
    return taskType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getDaysFromNow = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const todayTasks = recommendations.filter(r => {
    const taskDate = new Date(r.recommendedDate);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString();
  });

  const upcomingTasks = recommendations.filter(r => {
    const taskDate = new Date(r.recommendedDate);
    const today = new Date();
    return taskDate > today;
  });

  const highPriorityTasks = recommendations.filter(r => r.priorityScore >= 0.7);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Generate Button */}
      <Card>
        <CardHeader className="pb-3 px-4 pt-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <span className="text-base font-semibold">Smart Tasks</span>
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 leading-relaxed mt-1">
                  AI-generated tasks based on your farm conditions
                </CardDescription>
              </div>
              <Button 
                onClick={generateNewRecommendations}
                disabled={generatingNew}
                size="sm"
                variant="outline"
                className="flex-shrink-0 h-8 px-3"
              >
                {generatingNew ? (
                  <>
                    <Settings className="h-3 w-3 mr-1 animate-spin" />
                    <span className="text-xs">Loading</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3 mr-1" />
                    <span className="text-xs">Refresh</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {recommendations.length > 0 && (
          <CardContent className="pt-0 px-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{todayTasks.length}</div>
                <div className="text-xs text-gray-500">Today</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">{highPriorityTasks.length}</div>
                <div className="text-xs text-gray-500">Priority</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">{recommendations.length}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Brain className="h-10 w-10 text-purple-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800 mb-2">No Active Recommendations</h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Generate AI-powered task recommendations based on your farm's current conditions.
            </p>
            <Button 
              onClick={generateNewRecommendations} 
              disabled={generatingNew}
              className="w-full sm:w-auto"
            >
              <Zap className="h-4 w-4 mr-2" />
              Generate Smart Tasks
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Today's Tasks */}
          {todayTasks.length > 0 && (
            <div>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2 px-1">
                <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span>Today's Tasks ({todayTasks.length})</span>
              </h3>
              <div className="space-y-3">
                {todayTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onAction={handleTaskAction}
                    isToday={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Tasks */}
          {upcomingTasks.length > 0 && (
            <div>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2 px-1">
                <TrendingUp className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span>Upcoming Tasks ({upcomingTasks.length})</span>
              </h3>
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onAction={handleTaskAction}
                    isToday={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-purple-800 mb-2">
            <Brain className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">Personalized AI Recommendations</span>
          </div>
          <div className="text-xs text-purple-700 leading-relaxed">
            Tasks generated from weather, farm history, and pest predictions. Accept or reject to help AI learn your style.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface TaskCardProps {
  task: AITaskRecommendation;
  onAction: (taskId: string, action: 'accepted' | 'rejected' | 'completed', feedback?: string) => void;
  isToday: boolean;
}

function TaskCard({ task, onAction, isToday }: TaskCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getPriorityColor = (priorityScore: number) => {
    if (priorityScore >= 0.8) return 'border-l-red-500 bg-red-50';
    if (priorityScore >= 0.6) return 'border-l-orange-500 bg-orange-50';
    if (priorityScore >= 0.4) return 'border-l-yellow-500 bg-yellow-50';
    return 'border-l-green-500 bg-green-50';
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'irrigation': return <Droplets className="h-5 w-5 text-blue-600" />;
      case 'spray': return <SprayCan className="h-5 w-5 text-orange-600" />;
      case 'harvest': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'fertigation': return <FlaskConical className="h-5 w-5 text-purple-600" />;
      case 'pruning': return <Scissors className="h-5 w-5 text-red-600" />;
      case 'soil_test': return <Settings className="h-5 w-5 text-gray-600" />;
      default: return <Calendar className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatTaskType = (taskType: string) => {
    return taskType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getDaysFromNow = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  const getPriorityLabel = (priorityScore: number) => {
    if (priorityScore >= 0.8) return 'CRITICAL';
    if (priorityScore >= 0.6) return 'HIGH';
    if (priorityScore >= 0.4) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <Card className={`border-l-4 ${getPriorityColor(task.priorityScore)} transition-all duration-200 hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {getTaskIcon(task.taskType)}
              <div>
                <h3 className="font-semibold">
                  {formatTaskType(task.taskType)}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{getDaysFromNow(task.recommendedDate)}</span>
                  </div>
                  <Badge variant={task.priorityScore >= 0.7 ? 'destructive' : 
                                task.priorityScore >= 0.5 ? 'secondary' : 'outline'}>
                    {getPriorityLabel(task.priorityScore)}
                  </Badge>
                  {task.weatherDependent && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <CloudRain className="h-3 w-3" />
                      <span className="text-xs">Weather Dependent</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {Math.round(task.confidenceScore * 100)}%
            </div>
            <div className="text-xs text-gray-500">AI Confidence</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* AI Reasoning */}
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-l-blue-500 rounded-r">
          <div className="flex items-start gap-2">
            <Brain className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-blue-800 mb-1">AI Reasoning</div>
              <div className="text-sm text-blue-700">{task.reasoning}</div>
            </div>
          </div>
        </div>

        {/* Task Details */}
        {task.taskDetails && (
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 mb-2"
            >
              <Settings className="h-4 w-4" />
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
            
            {showDetails && (
              <div className="space-y-2 text-sm">
                {task.taskDetails.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>Estimated Duration: {task.taskDetails.duration} minutes</span>
                  </div>
                )}
                
                {task.taskDetails.resources && task.taskDetails.resources.length > 0 && (
                  <div>
                    <div className="font-medium text-gray-700 mb-1">Resources Needed:</div>
                    <div className="flex flex-wrap gap-1">
                      {task.taskDetails.resources.map((resource, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {resource}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {task.taskDetails.conditions && task.taskDetails.conditions.length > 0 && (
                  <div>
                    <div className="font-medium text-gray-700 mb-1">Conditions:</div>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {task.taskDetails.conditions.map((condition, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {condition}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {task.taskDetails.alternatives && task.taskDetails.alternatives.length > 0 && (
                  <div>
                    <div className="font-medium text-gray-700 mb-1">Alternatives:</div>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {task.taskDetails.alternatives.map((alternative, idx) => (
                        <li key={idx}>• {alternative}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={() => onAction(task.id, 'accepted')}
            className="flex-1"
            variant={isToday ? "default" : "outline"}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Accept Task
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onAction(task.id, 'completed')}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Mark Done
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onAction(task.id, 'rejected', 'Not applicable')}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Confidence and Expiry */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Progress value={task.confidenceScore * 100} className="w-16 h-1" />
            <span>{Math.round(task.confidenceScore * 100)}% confidence</span>
          </div>
          <div>
            Expires: {task.expiresAt.toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}