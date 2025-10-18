'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import {
  TASK_TEMPLATES,
  TaskTemplate,
  getTemplatesByType,
  getCurrentSeasonTemplates
} from '@/lib/task-templates'
import {
  Search,
  Filter,
  Clock,
  Calendar,
  Droplets,
  SprayCan,
  Scissors,
  Grape,
  TestTube,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

export interface TaskTemplateFormData {
  title: string
  description: string
  dueDate?: Date
  type: string
  priority: string
  isRecurring: boolean
  frequency?: string
  endDate?: Date
  customInstructions?: string
}

interface TaskTemplateSelectorProps {
  onSelectTemplate: (formData: TaskTemplateFormData) => void
  onCancel: () => void
  selectedFarmName: string
}

export function TaskTemplateSelector({
  onSelectTemplate,
  onCancel,
  selectedFarmName
}: TaskTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [showOnlySeasonal, setShowOnlySeasonal] = useState(false)

  const [formData, setFormData] = useState<TaskTemplateFormData>({
    title: '',
    description: '',
    dueDate: undefined,
    type: 'other',
    priority: 'medium',
    isRecurring: false,
    customInstructions: ''
  })

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'irrigation':
        return <Droplets className="h-4 w-4 text-blue-500" />
      case 'spray':
        return <SprayCan className="h-4 w-4 text-green-500" />
      case 'training':
        return <Scissors className="h-4 w-4 text-purple-500" />
      case 'harvest':
        return <Grape className="h-4 w-4 text-red-500" />
      case 'fertigation':
        return <TestTube className="h-4 w-4 text-orange-500" />
      case 'soil_test':
        return <TestTube className="h-4 w-4 text-brown-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
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

  const filteredTemplates = TASK_TEMPLATES.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || template.type === filterType

    const isSeasonalMatch =
      !showOnlySeasonal || getCurrentSeasonTemplates().some((t) => t.id === template.id)

    return matchesSearch && matchesType && isSeasonalMatch
  })

  const handleTemplateSelect = (template: TaskTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      title: template.title,
      description: template.description,
      dueDate: undefined,
      type: template.type,
      priority: template.priority,
      isRecurring: template.frequency !== 'once',
      frequency: template.frequency,
      customInstructions: template.instructions || ''
    })
  }

  const handleInputChange = <K extends keyof Omit<TaskTemplateFormData, 'dueDate' | 'endDate'>>(
    field: K,
    value: TaskTemplateFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRecurringToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isRecurring: checked,
      frequency: checked ? prev.frequency ?? 'weekly' : undefined,
      endDate: checked ? prev.endDate : undefined
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.dueDate) return
    onSelectTemplate(formData)
  }

  const taskTypes = [
    { value: 'all', label: 'All Types', icon: <Filter className="h-4 w-4" /> },
    { value: 'irrigation', label: 'Irrigation', icon: <Droplets className="h-4 w-4" /> },
    { value: 'spray', label: 'Spray', icon: <SprayCan className="h-4 w-4" /> },
    { value: 'fertigation', label: 'Fertigation', icon: <TestTube className="h-4 w-4" /> },
    { value: 'training', label: 'Training', icon: <Scissors className="h-4 w-4" /> },
    { value: 'harvest', label: 'Harvest', icon: <Grape className="h-4 w-4" /> },
    { value: 'soil_test', label: 'Soil Test', icon: <TestTube className="h-4 w-4" /> }
  ]

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Task Template</CardTitle>
          <CardDescription>
            Select from pre-defined farming tasks for {selectedFarmName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Templates</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by task name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {/* Task Type Filter */}
          <div>
            <Label>Filter by Type</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {taskTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={filterType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(type.value)}
                  className="flex items-center gap-1"
                >
                  {type.icon}
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Seasonal Filter */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="seasonal"
              checked={showOnlySeasonal}
              onChange={(e) => setShowOnlySeasonal(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="seasonal">Show only current season tasks</Label>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Available Templates ({filteredTemplates.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getTaskTypeIcon(template.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{template.title}</h4>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(template.priority)}`}
                        >
                          {template.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {template.estimatedDuration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {template.estimatedDuration}
                          </span>
                        )}
                        {template.frequency && template.frequency !== 'once' && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {template.frequency}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedTemplate?.id === template.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Task Configuration Form */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Task Configuration</h3>
          {selectedTemplate ? (
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dueDate">Due Date</Label>
                      <DatePicker
                        id="dueDate"
                        date={formData.dueDate}
                        onDateChange={(date) =>
                          setFormData((prev) => ({ ...prev, dueDate: date }))
                        }
                        placeholder="Select due date"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <select
                        id="priority"
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  {/* Recurring Task Options */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="recurring"
                        checked={formData.isRecurring}
                        onChange={(e) => handleRecurringToggle(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="recurring">Make this a recurring task</Label>
                    </div>

                    {formData.isRecurring && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="frequency">Frequency</Label>
                          <select
                            id="frequency"
                            value={formData.frequency || 'weekly'}
                            onChange={(e) => handleInputChange('frequency', e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="seasonal">Seasonal</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="endDate">End Date (optional)</Label>
                          <DatePicker
                            id="endDate"
                            date={formData.endDate}
                            onDateChange={(date) =>
                              setFormData((prev) => ({ ...prev, endDate: date }))
                            }
                            placeholder="Select end date"
                            fromDate={formData.dueDate}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="instructions">Custom Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={formData.customInstructions}
                      onChange={(e) => handleInputChange('customInstructions', e.target.value)}
                      placeholder="Add any specific instructions or notes..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1" disabled={!formData.dueDate}>
                      Create Task
                    </Button>
                    <Button type="button" variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Template</h3>
                <p className="text-muted-foreground">
                  Choose a task template from the list to configure and create your farming task.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
