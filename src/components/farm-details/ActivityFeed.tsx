"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Droplets, 
  SprayCan, 
  Scissors, 
  DollarSign,
  TestTube,
  Beaker,
  Calendar,
  Clock,
  CheckCircle,
  Edit
} from "lucide-react";

interface ActivityFeedProps {
  recentActivities: any[];
  pendingTasks: any[];
  loading: boolean;
  onCompleteTask: (taskId: number) => void;
  onEditRecord: (record: any, recordType: string) => void;
}

export function ActivityFeed({ 
  recentActivities, 
  pendingTasks, 
  loading,
  onCompleteTask,
  onEditRecord
}: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'irrigation': return Droplets;
      case 'spray': return SprayCan;
      case 'harvest': return Scissors;
      case 'expense': return DollarSign;
      case 'fertigation': return Beaker;
      case 'soil_test': return TestTube;
      default: return Calendar;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'irrigation': return 'bg-blue-100 text-blue-600';
      case 'spray': return 'bg-green-100 text-green-600';
      case 'harvest': return 'bg-purple-100 text-purple-600';
      case 'expense': return 'bg-amber-100 text-amber-600';
      case 'fertigation': return 'bg-emerald-100 text-emerald-600';
      case 'soil_test': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Pending Tasks Loading */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities Loading */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border-l-4 border-gray-200">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Pending Tasks */}
      {pendingTasks && pendingTasks.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Tasks ({pendingTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.slice(0, 3).map((task, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-200">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-amber-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {task.title || task.task_type || 'Task'}
                    </p>
                    <p className="text-xs text-gray-600">
                      Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => onCompleteTask(task.id)}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                  >
                    Complete
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities && recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.slice(0, 5).map((activity, index) => {
                const Icon = getActivityIcon(activity.type);
                const colorClass = getActivityColor(activity.type);
                
                return (
                  <div key={index} className="flex items-center gap-3 p-3 border-l-4 border-green-200 bg-gray-50 rounded-r-xl">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {activity.title || `${activity.type} activity`}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {activity.type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>{new Date(activity.date || activity.created_at).toLocaleDateString()}</span>
                          {activity.notes && (
                            <>
                              <span>•</span>
                              <span className="truncate">{activity.notes}</span>
                            </>
                          )}
                        </div>
                        
                        {(activity.type === 'irrigation' || activity.type === 'spray' || activity.type === 'harvest') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditRecord(activity, activity.type)}
                            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No recent activities</p>
              <p className="text-xs text-gray-400 mt-1">
                Start logging activities to see them here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}