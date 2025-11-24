'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  IndianRupee,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  User,
  Users,
  Wallet
} from 'lucide-react'

import { LaborService } from '@/lib/labor-service'
import type {
  Worker,
  WorkerCreateInput,
  WorkerAttendance,
  WorkerAttendanceCreateInput,
  WorkerTransaction,
  WorkStatus,
  TemporaryWorkerEntry
} from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { createClient } from '@/lib/supabase'

interface Farm {
  id: number
  name: string
}

interface AttendanceFormEntry {
  id: string
  isTemporary: boolean
  workerId?: number
  tempName: string
  status: WorkStatus | 'not_set'
  salary: string
  advanceDeduction: string
}

export default function WorkersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useSupabaseAuth()

  // Main data
  const [workers, setWorkers] = useState<Worker[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'workers' | 'attendance' | 'analytics'>('workers')

  // Worker modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [deleteWorker, setDeleteWorker] = useState<Worker | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<WorkerCreateInput>({
    name: '',
    daily_rate: 300,
    advance_balance: 0
  })

  // Worker detail sheet
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [workerAttendance, setWorkerAttendance] = useState<WorkerAttendance[]>([])
  const [workerTransactions, setWorkerTransactions] = useState<WorkerTransaction[]>([])
  const [loadingWorkerData, setLoadingWorkerData] = useState(false)

  // Advance modal
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false)
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [advanceNotes, setAdvanceNotes] = useState('')
  const [isSavingAdvance, setIsSavingAdvance] = useState(false)

  // Settlement modal
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false)
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null)
  const [settlementPeriod, setSettlementPeriod] = useState<'this_week' | 'last_week' | 'custom'>(
    'this_week'
  )
  const [settlementStartDate, setSettlementStartDate] = useState('')
  const [settlementEndDate, setSettlementEndDate] = useState('')
  const [settlementCalculation, setSettlementCalculation] = useState<{
    days_worked: number
    gross_amount: number
    attendance_details: Array<{
      date: string
      work_status: WorkStatus
      work_type: string
      rate: number
      earnings: number
    }>
  } | null>(null)
  const [advanceDeduction, setAdvanceDeduction] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [isConfirmingSettlement, setIsConfirmingSettlement] = useState(false)

  // Attendance tab state
  const [attendanceFarmId, setAttendanceFarmId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [attendanceFormEntries, setAttendanceFormEntries] = useState<AttendanceFormEntry[]>([])
  const [isSavingAttendanceEntries, setIsSavingAttendanceEntries] = useState(false)
  const [attendanceHistoryWorkerId, setAttendanceHistoryWorkerId] = useState<number | null>(null)
  const [attendanceHistory, setAttendanceHistory] = useState<WorkerAttendance[]>([])
  const [attendanceHistoryLoading, setAttendanceHistoryLoading] = useState(false)
  const [editingAttendanceRecord, setEditingAttendanceRecord] = useState<WorkerAttendance | null>(
    null
  )
  const [editAttendanceForm, setEditAttendanceForm] = useState<{
    date: string
    status: WorkStatus
    salary: string
    workType: string
    notes: string
  }>({
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'full_day',
    salary: '',
    workType: 'other',
    notes: ''
  })
  const [isSavingAttendanceEdit, setIsSavingAttendanceEdit] = useState(false)
  const [attendanceRecordToDelete, setAttendanceRecordToDelete] = useState<WorkerAttendance | null>(
    null
  )
  const [isDeletingAttendance, setIsDeletingAttendance] = useState(false)

  // Analytics state
  const [analyticsFarmId, setAnalyticsFarmId] = useState<number | null>(null)
  const [analyticsStartDate, setAnalyticsStartDate] = useState(
    format(subWeeks(new Date(), 4), 'yyyy-MM-dd')
  )
  const [analyticsEndDate, setAnalyticsEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [fixedAnalytics, setFixedAnalytics] = useState<{
    salaryTotal: number
    advanceRecovered: number
    byWorker: Array<{
      worker_id: number
      worker_name: string
      salary: number
      days: number
      advance: number
    }>
    attendanceRecords: WorkerAttendance[]
    advanceTransactions: WorkerTransaction[]
  }>({
    salaryTotal: 0,
    advanceRecovered: 0,
    byWorker: [],
    attendanceRecords: [],
    advanceTransactions: []
  })
  const [tempAnalytics, setTempAnalytics] = useState<{
    totalPaid: number
    byWorker: Array<{ name: string; totalPaid: number; hours: number }>
    entries: TemporaryWorkerEntry[]
  }>({
    totalPaid: 0,
    byWorker: [],
    entries: []
  })
  const [showFixedDetails, setShowFixedDetails] = useState(false)
  const [selectedFixedWorker, setSelectedFixedWorker] = useState<number | 'all'>('all')
  const [showTempDetails, setShowTempDetails] = useState(false)
  const [selectedTempWorker, setSelectedTempWorker] = useState<string>('all')

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const [workersData, farmsResult] = await Promise.all([
        LaborService.getWorkers(true),
        supabase.from('farms').select('id, name').order('name')
      ])

      setWorkers(workersData)
      setFarms(farmsResult.data || [])

      // Auto-select farm if only one
      if (farmsResult.data && farmsResult.data.length === 1) {
        setAttendanceFarmId(farmsResult.data[0].id)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user) {
      fetchData()
    }
  }, [authLoading, user, fetchData])

  const fetchAnalyticsData = useCallback(async () => {
    if (viewMode !== 'analytics') return
    if (analyticsStartDate > analyticsEndDate) {
      toast.error('Start date must be before end date')
      return
    }
    try {
      setAnalyticsLoading(true)
      const supabase = createClient() as any // Cast because labor tables aren't in generated Supabase types yet

      let attendanceQuery = supabase
        .from('worker_attendance')
        .select('*, worker:workers(*)')
        .gte('date', analyticsStartDate)
        .lte('date', analyticsEndDate)
        .neq('work_status', 'absent')

      if (analyticsFarmId) {
        attendanceQuery = attendanceQuery.eq('farm_id', analyticsFarmId)
      }

      const { data: attendanceData, error: attendanceError } = await attendanceQuery
      if (attendanceError) throw attendanceError

      let advanceQuery = supabase
        .from('worker_transactions')
        .select('*')
        .eq('type', 'advance_deducted')
        .gte('date', analyticsStartDate)
        .lte('date', analyticsEndDate)

      if (analyticsFarmId) {
        advanceQuery = advanceQuery.eq('farm_id', analyticsFarmId)
      }

      const { data: advanceData, error: advanceError } = await advanceQuery
      if (advanceError) throw advanceError

      let tempQuery = supabase
        .from('temporary_worker_entries')
        .select('*')
        .gte('date', analyticsStartDate)
        .lte('date', analyticsEndDate)
      if (analyticsFarmId) {
        tempQuery = tempQuery.eq('farm_id', analyticsFarmId)
      }
      const { data: tempData, error: tempError } = await tempQuery
      if (tempError) throw tempError

      // Compute fixed analytics
      let salaryTotal = 0
      const salaryByWorker: Record<number, { name: string; salary: number; days: number }> = {}
      for (const record of attendanceData || []) {
        const worker = (record as any).worker as Worker
        const rate = record.daily_rate_override ?? worker?.daily_rate ?? 0
        const dayFraction = record.work_status === 'full_day' ? 1 : 0.5
        const cost = rate * dayFraction
        salaryTotal += cost
        if (!salaryByWorker[record.worker_id]) {
          salaryByWorker[record.worker_id] = {
            name: worker?.name || 'Unknown',
            salary: 0,
            days: 0
          }
        }
        salaryByWorker[record.worker_id].salary += cost
        salaryByWorker[record.worker_id].days += dayFraction
      }

      let advanceRecovered = 0
      const advanceByWorker: Record<number, number> = {}
      for (const tx of advanceData || []) {
        advanceRecovered += tx.amount
        advanceByWorker[tx.worker_id] = (advanceByWorker[tx.worker_id] || 0) + tx.amount
      }

      setFixedAnalytics({
        salaryTotal,
        advanceRecovered,
        byWorker: Object.entries(salaryByWorker).map(([workerId, data]) => ({
          worker_id: parseInt(workerId, 10),
          worker_name: data.name,
          salary: data.salary,
          days: data.days,
          advance: advanceByWorker[parseInt(workerId, 10)] || 0
        })),
        attendanceRecords: (attendanceData || []) as WorkerAttendance[],
        advanceTransactions: (advanceData || []) as WorkerTransaction[]
      })

      const tempByName: Record<string, { total: number; hours: number }> = {}
      let tempTotal = 0
      for (const entry of tempData || []) {
        tempTotal += entry.amount_paid
        if (!tempByName[entry.name]) {
          tempByName[entry.name] = { total: 0, hours: 0 }
        }
        tempByName[entry.name].total += entry.amount_paid
        tempByName[entry.name].hours += entry.hours_worked
      }
      setTempAnalytics({
        totalPaid: tempTotal,
        byWorker: Object.entries(tempByName).map(([name, data]) => ({
          name,
          totalPaid: data.total,
          hours: data.hours
        })),
        entries: (tempData || []) as TemporaryWorkerEntry[]
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load worker analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  }, [viewMode, analyticsStartDate, analyticsEndDate, analyticsFarmId])

  useEffect(() => {
    if (viewMode === 'analytics') {
      fetchAnalyticsData()
    }
  }, [viewMode, analyticsStartDate, analyticsEndDate, analyticsFarmId, fetchAnalyticsData])

  const loadAttendanceHistory = useCallback(async (workerId: number) => {
    try {
      setAttendanceHistoryLoading(true)
      const history = await LaborService.getAttendanceByWorker(workerId)
      setAttendanceHistory(history)
    } catch (error) {
      console.error('Error loading attendance history:', error)
      toast.error('Failed to load attendance history')
    } finally {
      setAttendanceHistoryLoading(false)
    }
  }, [])

  const handleOpenEditAttendance = (record: WorkerAttendance) => {
    const worker = workers.find((w) => w.id === record.worker_id)
    setEditingAttendanceRecord(record)
    setEditAttendanceForm({
      date: record.date,
      status: record.work_status,
      salary:
        record.work_status === 'absent'
          ? '0'
          : (
              (record.daily_rate_override ?? worker?.daily_rate ?? 0) *
              statusToFraction(record.work_status)
            ).toString(),
      workType: record.work_type,
      notes: record.notes || ''
    })
  }

  const handleCloseEditAttendance = () => {
    setEditingAttendanceRecord(null)
    setIsSavingAttendanceEdit(false)
  }

  const handleRequestDeleteAttendance = (record: WorkerAttendance) => {
    setAttendanceRecordToDelete(record)
  }

  useEffect(() => {
    if (viewMode === 'attendance' && !attendanceFarmId && farms.length > 0) {
      setAttendanceFarmId(farms[0].id)
    }
  }, [viewMode, attendanceFarmId, farms])

  useEffect(() => {
    if (viewMode !== 'attendance') return
    const activeWorkerList = workers.filter((worker) => worker.is_active)
    if (activeWorkerList.length === 0) {
      setAttendanceHistoryWorkerId(null)
      setAttendanceHistory([])
      return
    }
    const isSelectedWorkerValid = activeWorkerList.some(
      (worker) => worker.id === attendanceHistoryWorkerId
    )
    if (!attendanceHistoryWorkerId || !isSelectedWorkerValid) {
      setAttendanceHistoryWorkerId(activeWorkerList[0].id)
    }
  }, [viewMode, workers, attendanceHistoryWorkerId])

  useEffect(() => {
    if (viewMode !== 'attendance' || !attendanceHistoryWorkerId) return
    loadAttendanceHistory(attendanceHistoryWorkerId)
  }, [viewMode, attendanceHistoryWorkerId, loadAttendanceHistory])

  // Worker CRUD handlers
  const handleOpenAddModal = () => {
    setFormData({ name: '', daily_rate: 300, advance_balance: 0 })
    setEditingWorker(null)
    setIsAddModalOpen(true)
  }

  const handleOpenEditModal = (worker: Worker) => {
    setFormData({
      name: worker.name,
      daily_rate: worker.daily_rate,
      advance_balance: worker.advance_balance ?? 0
    })
    setEditingWorker(worker)
    setIsAddModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsAddModalOpen(false)
    setEditingWorker(null)
    setFormData({ name: '', daily_rate: 300, advance_balance: 0 })
  }

  const handleSaveWorker = async () => {
    if (!formData.name.trim()) {
      toast.error('Worker name is required')
      return
    }
    if (formData.daily_rate <= 0) {
      toast.error('Daily rate must be greater than 0')
      return
    }

    setIsSaving(true)
    try {
      if (editingWorker) {
        await LaborService.updateWorker(editingWorker.id, {
          name: formData.name,
          daily_rate: formData.daily_rate,
          advance_balance: formData.advance_balance
        })
        toast.success('Worker updated successfully')
      } else {
        await LaborService.createWorker(formData)
        toast.success('Worker added successfully')
      }
      handleCloseModal()
      fetchData()
    } catch (error) {
      console.error('Error saving worker:', error)
      toast.error(editingWorker ? 'Failed to update worker' : 'Failed to add worker')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteWorker = async () => {
    if (!deleteWorker) return
    try {
      await LaborService.deleteWorker(deleteWorker.id)
      toast.success('Worker deactivated successfully')
      setDeleteWorker(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting worker:', error)
      toast.error('Failed to deactivate worker')
    }
  }

  // Worker detail handlers
  const handleOpenWorkerDetail = async (worker: Worker) => {
    setSelectedWorker(worker)
    setLoadingWorkerData(true)
    try {
      const [attendance, transactions] = await Promise.all([
        LaborService.getAttendanceByWorker(worker.id),
        LaborService.getTransactionsByWorker(worker.id)
      ])
      setWorkerAttendance(attendance)
      setWorkerTransactions(transactions)
    } catch (error) {
      console.error('Error loading worker data:', error)
      toast.error('Failed to load worker details')
    } finally {
      setLoadingWorkerData(false)
    }
  }

  const handleCloseWorkerDetail = () => {
    setSelectedWorker(null)
    setWorkerAttendance([])
    setWorkerTransactions([])
  }

  // Advance handlers
  const handleGiveAdvance = async () => {
    if (!selectedWorker) return
    const amount = parseFloat(advanceAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsSavingAdvance(true)
    try {
      await LaborService.giveAdvance(
        selectedWorker.id,
        amount,
        format(new Date(), 'yyyy-MM-dd'),
        undefined,
        advanceNotes || undefined
      )
      toast.success(`Advance of ₹${amount.toLocaleString('en-IN')} given successfully`)
      setIsAdvanceModalOpen(false)
      setAdvanceAmount('')
      setAdvanceNotes('')
      // Refresh data
      fetchData()
      handleOpenWorkerDetail(selectedWorker)
    } catch (error) {
      console.error('Error giving advance:', error)
      toast.error('Failed to record advance')
    } finally {
      setIsSavingAdvance(false)
    }
  }

  // Settlement handlers
  useEffect(() => {
    const today = new Date()
    if (settlementPeriod === 'this_week') {
      setSettlementStartDate(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
      setSettlementEndDate(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
    } else if (settlementPeriod === 'last_week') {
      const lastWeek = subWeeks(today, 1)
      setSettlementStartDate(format(startOfWeek(lastWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
      setSettlementEndDate(format(endOfWeek(lastWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
    }
  }, [settlementPeriod])

  const handleCalculateSettlement = async () => {
    if (!selectedWorker || !settlementStartDate || !settlementEndDate) return

    setIsCalculating(true)
    try {
      const calculation = await LaborService.calculateSettlement(
        selectedWorker.id,
        selectedFarmId,
        settlementStartDate,
        settlementEndDate
      )
      setSettlementCalculation(calculation)
      const maxDeduction = Math.min(selectedWorker.advance_balance || 0, calculation.gross_amount)
      setAdvanceDeduction(maxDeduction.toString())
    } catch (error) {
      console.error('Error calculating settlement:', error)
      toast.error('Failed to calculate settlement')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleConfirmSettlement = async () => {
    if (!selectedWorker || !settlementCalculation) return

    const deduction = parseFloat(advanceDeduction) || 0
    if (deduction < 0 || deduction > (selectedWorker.advance_balance || 0)) {
      toast.error('Invalid deduction amount')
      return
    }

    setIsConfirmingSettlement(true)
    try {
      const netPayment = settlementCalculation.gross_amount - deduction
      await LaborService.createSettlement(
        {
          worker_id: selectedWorker.id,
          farm_id: selectedFarmId || undefined,
          period_start: settlementStartDate,
          period_end: settlementEndDate,
          days_worked: settlementCalculation.days_worked,
          gross_amount: settlementCalculation.gross_amount,
          advance_deducted: deduction,
          net_payment: netPayment,
          notes: ''
        },
        true
      )
      toast.success(`Settlement confirmed! Net payment: ₹${netPayment.toLocaleString('en-IN')}`)
      setIsSettlementModalOpen(false)
      setSettlementCalculation(null)
      fetchData()
      handleOpenWorkerDetail(selectedWorker)
    } catch (error) {
      console.error('Error confirming settlement:', error)
      toast.error('Failed to confirm settlement')
    } finally {
      setIsConfirmingSettlement(false)
    }
  }

  // Attendance modal helpers
  const createAttendanceEntry = (isTemporary = false, worker?: Worker): AttendanceFormEntry => {
    const defaultWorker = worker ?? workers.find((w) => w.is_active)
    return {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      isTemporary,
      workerId: !isTemporary ? defaultWorker?.id : undefined,
      tempName: '',
      status: 'not_set',
      salary: !isTemporary && defaultWorker ? defaultWorker.daily_rate.toString() : '',
      advanceDeduction: ''
    }
  }

  const handleOpenAttendanceModal = () => {
    if (farms.length === 0) {
      toast.error('Add a farm before recording attendance')
      return
    }
    const defaultFarmId = attendanceFarmId ?? farms[0].id
    setAttendanceFarmId(defaultFarmId)
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
    setAttendanceFormEntries([createAttendanceEntry(false)])
    setIsAttendanceModalOpen(true)
  }

  const handleAddAttendanceEntry = () => {
    setAttendanceFormEntries((prev) => [...prev, createAttendanceEntry(false)])
  }

  const handleRemoveAttendanceEntry = (entryId: string) => {
    setAttendanceFormEntries((prev) => prev.filter((entry) => entry.id !== entryId))
  }

  const updateAttendanceFormEntry = (
    entryId: string,
    field: keyof AttendanceFormEntry,
    value: string | number | boolean | undefined
  ) => {
    setAttendanceFormEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              [field]: value
            }
          : entry
      )
    )
  }

  const handleToggleTemporary = (entryId: string, isTemporary: boolean) => {
    setAttendanceFormEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...createAttendanceEntry(isTemporary), id: entryId } : entry
      )
    )
  }

  const statusToFraction = (status: WorkStatus | 'not_set') => {
    if (status === 'half_day') return 0.5
    if (status === 'full_day' || status === 'not_set') return 1
    return 0
  }

  const handleWorkerSelect = (entryId: string, workerId?: number) => {
    const worker = workers.find((w) => w.id === workerId)
    setAttendanceFormEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              workerId,
              salary:
                worker && !entry.isTemporary
                  ? (worker.daily_rate * statusToFraction(entry.status)).toString()
                  : '',
              advanceDeduction: ''
            }
          : entry
      )
    )
  }

  const handleAttendanceStatusChange = (entryId: string, status: WorkStatus) => {
    setAttendanceFormEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== entryId) return entry
        let updatedSalary = entry.salary
        if (entry.isTemporary) {
          const current = parseFloat(entry.salary)
          if (!Number.isNaN(current) && current > 0) {
            if (status === 'half_day' && entry.status !== 'half_day') {
              updatedSalary = (current / 2).toString()
            } else if (status === 'full_day' && entry.status === 'half_day') {
              updatedSalary = (current * 2).toString()
            }
          }
        } else if (entry.workerId) {
          const worker = workers.find((w) => w.id === entry.workerId)
          if (worker) {
            updatedSalary = (worker.daily_rate * statusToFraction(status)).toString()
          }
        }
        return {
          ...entry,
          status,
          salary: updatedSalary
        }
      })
    )
  }

  const handleEditFormChange = (
    field: keyof typeof editAttendanceForm,
    value: string | WorkStatus
  ) => {
    setEditAttendanceForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEditStatusChange = (status: WorkStatus) => {
    setEditAttendanceForm((prev) => {
      const worker = editingAttendanceRecord
        ? workers.find((w) => w.id === editingAttendanceRecord.worker_id)
        : undefined
      if (status === 'absent') {
        return { ...prev, status, salary: '0' }
      }

      let updatedSalary = prev.salary
      if (worker) {
        updatedSalary = (worker.daily_rate * statusToFraction(status)).toString()
      } else {
        const current = parseFloat(prev.salary)
        if (!Number.isNaN(current) && current > 0) {
          if (status === 'half_day' && prev.status !== 'half_day') {
            updatedSalary = (current / 2).toString()
          } else if (status === 'full_day' && prev.status === 'half_day') {
            updatedSalary = (current * 2).toString()
          }
        }
      }
      return { ...prev, status, salary: updatedSalary }
    })
  }

  const handleSaveAttendanceEdit = async () => {
    if (!editingAttendanceRecord) return

    setIsSavingAttendanceEdit(true)
    try {
      const isAbsent = editAttendanceForm.status === 'absent'
      const salaryValue = parseFloat(editAttendanceForm.salary)
      if (!isAbsent && (Number.isNaN(salaryValue) || salaryValue <= 0)) {
        toast.error('Enter a valid salary amount')
        setIsSavingAttendanceEdit(false)
        return
      }
      let dailyRateOverride: number | null = null
      if (isAbsent) {
        dailyRateOverride = 0
      } else {
        const fraction = statusToFraction(editAttendanceForm.status)
        const perDayRate = salaryValue / fraction
        if (!Number.isFinite(perDayRate) || perDayRate <= 0) {
          toast.error('Enter a valid salary amount')
          setIsSavingAttendanceEdit(false)
          return
        }
        const worker = workers.find((w) => w.id === editingAttendanceRecord.worker_id)
        const defaultRate = worker?.daily_rate
        dailyRateOverride =
          defaultRate && Math.abs(perDayRate - defaultRate) <= 0.01 ? null : perDayRate
      }

      await LaborService.updateAttendance(editingAttendanceRecord.id, {
        date: editAttendanceForm.date,
        work_status: editAttendanceForm.status,
        work_type: editAttendanceForm.workType,
        daily_rate_override: dailyRateOverride,
        notes: editAttendanceForm.notes || undefined
      })
      toast.success('Attendance updated')
      handleCloseEditAttendance()
      if (attendanceHistoryWorkerId) {
        loadAttendanceHistory(attendanceHistoryWorkerId)
      }
      if (selectedWorker && selectedWorker.id === editingAttendanceRecord.worker_id) {
        handleOpenWorkerDetail(selectedWorker)
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
      toast.error('Failed to update attendance')
    } finally {
      setIsSavingAttendanceEdit(false)
    }
  }

  const handleConfirmDeleteAttendance = async () => {
    if (!attendanceRecordToDelete) return
    setIsDeletingAttendance(true)
    try {
      await LaborService.deleteAttendance(attendanceRecordToDelete.id)
      toast.success('Attendance deleted')
      setAttendanceRecordToDelete(null)
      if (attendanceHistoryWorkerId) {
        loadAttendanceHistory(attendanceHistoryWorkerId)
      }
      if (selectedWorker && selectedWorker.id === attendanceRecordToDelete.worker_id) {
        handleOpenWorkerDetail(selectedWorker)
      }
    } catch (error) {
      console.error('Error deleting attendance:', error)
      toast.error('Failed to delete attendance')
    } finally {
      setIsDeletingAttendance(false)
    }
  }

  const handleSaveAttendanceEntries = async () => {
    if (!attendanceFarmId) {
      toast.error('Please select a farm')
      return
    }
    if (attendanceFormEntries.length === 0) {
      toast.error('Add at least one worker')
      return
    }

    const date = selectedDate
    const farmId = attendanceFarmId
    const deductionNote = `Attendance deduction for ${format(new Date(date), 'dd MMM yyyy')}`
    const attendancePayload: Parameters<typeof LaborService.bulkCreateAttendance>[0] = []
    const tempOperations: Promise<any>[] = []
    const deductionOperations: Promise<any>[] = []

    for (const entry of attendanceFormEntries) {
      if (entry.status === 'not_set') {
        toast.error('Select full day or half day for each worker')
        return
      }
      const salaryValue = parseFloat(entry.salary)
      if (Number.isNaN(salaryValue) || salaryValue <= 0) {
        toast.error('Enter valid salary for each worker')
        return
      }

      if (entry.isTemporary) {
        if (!entry.tempName.trim()) {
          toast.error('Temporary worker name is required')
          return
        }
        const hoursWorked = entry.status === 'full_day' ? 8 : 4
        tempOperations.push(
          LaborService.createTemporaryWorkerEntry({
            farm_id: farmId,
            date,
            name: entry.tempName.trim(),
            hours_worked: hoursWorked,
            amount_paid: salaryValue,
            notes: undefined
          })
        )
        continue
      }

      if (!entry.workerId) {
        toast.error('Select a worker for each entry')
        return
      }
      const worker = workers.find((w) => w.id === entry.workerId)
      const deductionValue = parseFloat(entry.advanceDeduction)
      if (!Number.isNaN(deductionValue) && deductionValue < 0) {
        toast.error('Advance deduction cannot be negative')
        return
      }
      if (
        !Number.isNaN(deductionValue) &&
        worker &&
        deductionValue > (worker.advance_balance || 0)
      ) {
        toast.error(`Deduction for ${worker.name} exceeds available advance balance`)
        return
      }

      const dayFraction = statusToFraction(entry.status)
      if (dayFraction <= 0) {
        toast.error('Invalid attendance status selected')
        return
      }
      const perDayRate = salaryValue / dayFraction
      if (!Number.isFinite(perDayRate) || perDayRate <= 0) {
        toast.error('Enter valid salary for each worker')
        return
      }
      const defaultRate = worker?.daily_rate
      const attendanceRecord: WorkerAttendanceCreateInput = {
        worker_id: entry.workerId,
        farm_id: farmId,
        date,
        work_status: entry.status as WorkStatus,
        work_type: 'other',
        daily_rate_override: perDayRate,
        notes: undefined
      }
      if (defaultRate && Math.abs(perDayRate - defaultRate) <= 0.01) {
        delete attendanceRecord.daily_rate_override
      }
      attendancePayload.push(attendanceRecord)

      if (!Number.isNaN(deductionValue) && deductionValue > 0) {
        deductionOperations.push(
          LaborService.createTransaction({
            worker_id: entry.workerId,
            farm_id: farmId,
            date,
            type: 'advance_deducted',
            amount: deductionValue,
            notes: deductionNote
          })
        )
      }
    }

    setIsSavingAttendanceEntries(true)
    try {
      if (attendancePayload.length > 0) {
        await LaborService.bulkCreateAttendance(attendancePayload)
      }
      if (tempOperations.length > 0) {
        await Promise.all(tempOperations)
      }
      if (deductionOperations.length > 0) {
        await Promise.all(deductionOperations)
      }
      toast.success('Attendance recorded successfully')
      setIsAttendanceModalOpen(false)
      fetchData()
      if (attendanceHistoryWorkerId) {
        loadAttendanceHistory(attendanceHistoryWorkerId)
      }
    } catch (error) {
      console.error('Error recording attendance:', error)
      toast.error('Failed to record attendance')
    } finally {
      setIsSavingAttendanceEntries(false)
    }
  }

  const totalAdvanceBalance = workers.reduce((sum, w) => sum + (w.advance_balance || 0), 0)
  const activeWorkers = workers.filter((w) => w.is_active).length
  const netPayment = settlementCalculation
    ? settlementCalculation.gross_amount - (parseFloat(advanceDeduction) || 0)
    : 0

  const renderWorkersView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }
    if (workers.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">No workers yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first worker to start tracking
            </p>
            <Button
              onClick={handleOpenAddModal}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-6"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Worker
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-3">
        {workers.map((worker) => (
          <Card
            key={worker.id}
            className={cn(
              'cursor-pointer border-none bg-gradient-to-r from-white to-primary/10 shadow-sm rounded-3xl transition hover:shadow-md',
              !worker.is_active && 'opacity-60'
            )}
            onClick={() => handleOpenWorkerDetail(worker)}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{worker.name}</h3>
                    <Badge className="text-xs" variant={worker.is_active ? 'outline' : 'secondary'}>
                      {worker.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      <span className="font-medium text-foreground">
                        ₹{worker.daily_rate.toLocaleString('en-IN')}
                      </span>
                      <span>/day</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600">
                      <Wallet className="h-4 w-4" />
                      <span className="font-semibold">
                        ₹{(worker.advance_balance || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs uppercase tracking-wide">advance</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenEditModal(worker)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteWorker(worker)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderAttendanceView = () => {
    if (farms.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No farms found. Create a farm first.</p>
            <Button onClick={() => router.push('/farms')}>Go to Farms</Button>
          </CardContent>
        </Card>
      )
    }

    const activeWorkers = workers.filter((worker) => worker.is_active)
    if (activeWorkers.length === 0) {
      return (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No active workers available. Add workers to start recording attendance.
          </CardContent>
        </Card>
      )
    }

    const selectedHistoryWorker = activeWorkers.find(
      (worker) => worker.id === attendanceHistoryWorkerId
    )
    const sortedAttendance = [...attendanceHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    const farmNameLookup = new Map(farms.map((farm) => [farm.id, farm.name]))

    const latestAttendanceLabel =
      sortedAttendance.length > 0
        ? format(new Date(sortedAttendance[0].date), 'dd MMM, yyyy')
        : 'No records yet'

    return (
      <div className="space-y-4 pb-32">
        <Card className="border-none bg-gradient-to-br from-primary/10 via-white to-white shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Worker focus
                </p>
                <h3 className="text-xl font-semibold mt-1">
                  {selectedHistoryWorker ? selectedHistoryWorker.name : 'Choose a worker'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Review attendance history or record a fresh entry for any farm and day.
                </p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-white px-4 py-3 text-sm shadow-sm">
                <p className="text-xs uppercase text-muted-foreground">Last recorded</p>
                <p className="font-semibold text-primary">{latestAttendanceLabel}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">Worker</Label>
              <Select
                value={attendanceHistoryWorkerId?.toString() || ''}
                onValueChange={(value) => setAttendanceHistoryWorkerId(parseInt(value, 10))}
              >
                <SelectTrigger className="h-12 rounded-2xl border-primary/20 bg-white">
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent>
                  {activeWorkers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id.toString()}>
                      {worker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleOpenAttendanceModal}
              className="w-full rounded-full bg-primary hover:bg-primary/90 text-white"
              size="lg"
            >
              <Check className="h-4 w-4 mr-2" />
              Record Attendance
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Past attendance</h3>
              <p className="text-sm text-muted-foreground">
                {selectedHistoryWorker
                  ? `Showing recent records for ${selectedHistoryWorker.name}`
                  : 'Select a worker to view their attendance history'}
              </p>
            </div>

            {attendanceHistoryLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !selectedHistoryWorker ? (
              <p className="text-center text-muted-foreground py-6">
                Choose a worker to see attendance.
              </p>
            ) : sortedAttendance.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No attendance recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
                {sortedAttendance.slice(0, 50).map((record) => {
                  const baseRate =
                    record.daily_rate_override ?? selectedHistoryWorker?.daily_rate ?? 0
                  const computedAmount =
                    baseRate *
                    (record.work_status === 'full_day'
                      ? 1
                      : record.work_status === 'half_day'
                        ? 0.5
                        : 0)
                  return (
                    <div
                      key={record.id}
                      className="rounded-2xl border border-muted bg-white/90 shadow-sm p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {format(new Date(record.date), 'EEE, MMM d')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {record.farm_id
                              ? farmNameLookup.get(record.farm_id) || `Farm #${record.farm_id}`
                              : 'Multiple farms'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              'px-3 py-1 rounded-full',
                              record.work_status === 'full_day' && 'bg-green-50 text-green-700',
                              record.work_status === 'half_day' && 'bg-amber-50 text-amber-700',
                              record.work_status === 'absent' && 'bg-muted text-muted-foreground'
                            )}
                          >
                            {record.work_status === 'full_day'
                              ? 'Full day'
                              : record.work_status === 'half_day'
                                ? 'Half day'
                                : 'Absent'}
                          </Badge>
                          <span className="text-sm font-medium capitalize text-muted-foreground">
                            {record.work_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground"
                            onClick={() => handleOpenEditAttendance(record)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => handleRequestDeleteAttendance(record)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t pt-3">
                        <div>
                          {record.notes ? (
                            <p className="text-sm text-muted-foreground">{record.notes}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">No notes added.</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-primary">
                            ₹{computedAmount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-muted-foreground">Recorded amount</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderAnalyticsView = () => (
    <div className="space-y-4 pb-32">
      <Card className="border-none bg-gradient-to-br from-primary/10 via-white to-white shadow-sm rounded-3xl">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                AI
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                  Analytics
                </p>
                <h3 className="text-xl font-semibold text-foreground">Labor cost insights</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose a date range and farm to understand salaries, advances, and temporary payouts.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase">From</Label>
              <Input
                type="date"
                value={analyticsStartDate}
                onChange={(e) => setAnalyticsStartDate(e.target.value)}
                className="h-12 rounded-2xl border-primary/20 bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase">To</Label>
              <Input
                type="date"
                value={analyticsEndDate}
                onChange={(e) => setAnalyticsEndDate(e.target.value)}
                className="h-12 rounded-2xl border-primary/20 bg-white"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase">Farm</Label>
              <Select
                value={analyticsFarmId?.toString() || 'all'}
                onValueChange={(value) =>
                  setAnalyticsFarmId(value === 'all' ? null : parseInt(value, 10))
                }
              >
                <SelectTrigger className="h-12 rounded-2xl border-primary/20 bg-white">
                  <SelectValue placeholder="All farms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All farms</SelectItem>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl border border-dashed border-primary/30 bg-white/70 p-4 text-sm text-muted-foreground">
              Filters are applied automatically. Adjust the range or farm and the analytics refresh
              instantly.
            </div>
          </div>
        </CardContent>
      </Card>

      {analyticsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="rounded-2xl border-none bg-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-primary">Fixed workers</p>
                  <p className="text-3xl font-bold mt-1">
                    ₹{fixedAnalytics.salaryTotal.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Advance recovered: ₹{fixedAnalytics.advanceRecovered.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                  Fixed
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-white shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-amber-600">
                    Temporary workers
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    ₹{tempAnalytics.totalPaid.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total hours:{' '}
                    {tempAnalytics.byWorker.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)}
                  </p>
                </div>
                <div className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold">
                  Temp
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none rounded-3xl shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Fixed worker breakdown
                  </p>
                  <h3 className="text-lg font-semibold">Salaries vs. recovered advances</h3>
                </div>
                <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {fixedAnalytics.byWorker.length} workers
                </div>
              </div>

              {fixedAnalytics.byWorker.length === 0 ? (
                <p className="text-sm text-muted-foreground">No records for this range.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {fixedAnalytics.byWorker.map((entry) => (
                    <div key={entry.worker_id} className="rounded-2xl border border-muted p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{entry.worker_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.days.toFixed(1)} days · ₹{entry.advance.toLocaleString('en-IN')}{' '}
                            recovered
                          </p>
                        </div>
                        <p className="text-base font-semibold">
                          ₹{entry.salary.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-2xl border border-dashed border-primary/30 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Drill down</p>
                    <h4 className="text-base font-semibold">Detailed salary & advance logs</h4>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFixedDetails((prev) => !prev)}
                  >
                    {showFixedDetails ? 'Hide Details' : 'View Details'}
                  </Button>
                </div>

                {showFixedDetails && fixedAnalytics.byWorker.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Worker</Label>
                      <Select
                        value={
                          selectedFixedWorker === 'all' ? 'all' : selectedFixedWorker.toString()
                        }
                        onValueChange={(value) =>
                          setSelectedFixedWorker(value === 'all' ? 'all' : parseInt(value, 10))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose worker" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All workers</SelectItem>
                          {fixedAnalytics.byWorker.map((entry) => (
                            <SelectItem key={entry.worker_id} value={entry.worker_id.toString()}>
                              {entry.worker_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <Card>
                        <CardContent className="p-3 space-y-2">
                          <p className="text-xs text-muted-foreground uppercase">Salary timeline</p>
                          <div className="h-48 overflow-y-auto pr-2 space-y-1">
                            {fixedAnalytics.attendanceRecords
                              .filter((record) =>
                                selectedFixedWorker === 'all'
                                  ? true
                                  : record.worker_id === selectedFixedWorker
                              )
                              .map((record) => {
                                const worker = (record as any).worker as Worker
                                const rate = record.daily_rate_override ?? worker?.daily_rate ?? 0
                                const amount = rate * (record.work_status === 'full_day' ? 1 : 0.5)
                                return (
                                  <div
                                    key={`${record.worker_id}-${record.date}-${record.work_type}`}
                                    className="flex items-center justify-between text-xs border-b py-1"
                                  >
                                    <span>
                                      {format(new Date(record.date), 'MMM d')} – {record.work_type}
                                    </span>
                                    <span>₹{amount.toLocaleString('en-IN')}</span>
                                  </div>
                                )
                              })}
                            {fixedAnalytics.attendanceRecords.filter((record) =>
                              selectedFixedWorker === 'all'
                                ? true
                                : record.worker_id === selectedFixedWorker
                            ).length === 0 && (
                              <p className="text-xs text-muted-foreground">No salary entries</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3 space-y-2">
                          <p className="text-xs text-muted-foreground uppercase">
                            Advance deductions
                          </p>
                          <div className="h-48 overflow-y-auto pr-2 space-y-1">
                            {fixedAnalytics.advanceTransactions
                              .filter((tx) =>
                                selectedFixedWorker === 'all'
                                  ? true
                                  : tx.worker_id === selectedFixedWorker
                              )
                              .map((tx) => (
                                <div
                                  key={tx.id}
                                  className="flex items-center justify-between text-xs border-b py-1"
                                >
                                  <span>{format(new Date(tx.date), 'MMM d')}</span>
                                  <span>₹{tx.amount.toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                            {fixedAnalytics.advanceTransactions.filter((tx) =>
                              selectedFixedWorker === 'all'
                                ? true
                                : tx.worker_id === selectedFixedWorker
                            ).length === 0 && (
                              <p className="text-xs text-muted-foreground">No deductions</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none rounded-3xl shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
                    Temporary workers
                  </p>
                  <h3 className="text-lg font-semibold">Payments to short-term labor</h3>
                </div>
                <div className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                  {tempAnalytics.byWorker.length} workers
                </div>
              </div>

              {tempAnalytics.byWorker.length === 0 ? (
                <p className="text-sm text-muted-foreground">No temporary workers recorded.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {tempAnalytics.byWorker.map((entry) => (
                    <div key={entry.name} className="rounded-2xl border border-muted p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{entry.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.hours.toFixed(1)} hours
                          </p>
                        </div>
                        <p className="text-base font-semibold">
                          ₹{entry.totalPaid.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-2xl border border-dashed border-amber-200 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Drill down</p>
                    <h4 className="text-base font-semibold">Detailed shift tracker</h4>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTempDetails((prev) => !prev)}
                  >
                    {showTempDetails ? 'Hide Details' : 'View Details'}
                  </Button>
                </div>

                {showTempDetails && tempAnalytics.byWorker.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Worker</Label>
                      <Select
                        value={selectedTempWorker}
                        onValueChange={(value) => setSelectedTempWorker(value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose worker" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All temporary workers</SelectItem>
                          {tempAnalytics.byWorker.map((entry) => (
                            <SelectItem key={entry.name} value={entry.name}>
                              {entry.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                      {tempAnalytics.entries
                        .filter((entry) =>
                          selectedTempWorker === 'all' ? true : entry.name === selectedTempWorker
                        )
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between text-sm border-b pb-1"
                          >
                            <div>
                              <p className="font-medium">{entry.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(entry.date), 'MMM d')} · {entry.hours_worked}h
                              </p>
                            </div>
                            <span>₹{entry.amount_paid.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      {tempAnalytics.entries.filter((entry) =>
                        selectedTempWorker === 'all' ? true : entry.name === selectedTempWorker
                      ).length === 0 && <p className="text-xs text-muted-foreground">No entries</p>}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Workers</h1>
              <p className="text-sm text-muted-foreground">Manage laborers & attendance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeWorkers}</p>
                  <p className="text-xs text-muted-foreground">Active Workers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ₹{totalAdvanceBalance.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Advance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="bg-white border rounded-2xl p-4 mb-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex rounded-full bg-muted p-1 mx-auto md:mx-0 w-full max-w-sm sm:max-w-md">
              {(['workers', 'attendance', 'analytics'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'flex-1 px-4 py-2 text-sm font-medium rounded-full transition text-center',
                    viewMode === mode ? 'bg-white shadow text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {mode === 'workers'
                    ? 'Workers'
                    : mode === 'attendance'
                      ? 'Attendance'
                      : 'Analytics'}
                </button>
              ))}
            </div>
            <div className="w-full max-w-sm sm:max-w-md mx-auto sm:mx-0">
              {viewMode === 'attendance' ? (
                <Button
                  onClick={handleOpenAttendanceModal}
                  size="lg"
                  className="w-full rounded-full bg-primary hover:bg-primary/90 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Record Attendance
                </Button>
              ) : viewMode !== 'analytics' ? (
                <Button
                  onClick={handleOpenAddModal}
                  size="lg"
                  className="w-full rounded-full bg-primary hover:bg-primary/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Worker
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {viewMode === 'workers' && renderWorkersView()}
        {viewMode === 'attendance' && renderAttendanceView()}
        {viewMode === 'analytics' && renderAnalyticsView()}
      </div>

      {/* Record Attendance Modal */}
      <Dialog open={isAttendanceModalOpen} onOpenChange={setIsAttendanceModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Record Attendance</DialogTitle>
            <DialogDescription>
              Choose a farm, date, and add fixed or temporary workers present for the day.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="attendance-farm">Farm</Label>
                <Select
                  value={attendanceFarmId?.toString() || ''}
                  onValueChange={(value) => setAttendanceFarmId(parseInt(value, 10))}
                >
                  <SelectTrigger id="attendance-farm">
                    <SelectValue placeholder="Select farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id.toString()}>
                        {farm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendance-date">Date</Label>
                <Input
                  id="attendance-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              {attendanceFormEntries.map((entry, index) => {
                const activeWorkers = workers.filter((worker) => worker.is_active)
                return (
                  <Card key={entry.id}>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold">Worker {index + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.isTemporary ? 'Temporary worker' : 'Fixed worker'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`temp-${entry.id}`}
                            checked={entry.isTemporary}
                            onCheckedChange={(checked) =>
                              handleToggleTemporary(entry.id, Boolean(checked))
                            }
                          />
                          <Label htmlFor={`temp-${entry.id}`} className="text-sm">
                            Temporary worker
                          </Label>
                          {attendanceFormEntries.length > 1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500"
                              onClick={() => handleRemoveAttendanceEntry(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {entry.isTemporary ? (
                          <div className="space-y-2 md:col-span-2">
                            <Label>Name *</Label>
                            <Input
                              value={entry.tempName}
                              onChange={(e) =>
                                updateAttendanceFormEntry(entry.id, 'tempName', e.target.value)
                              }
                              placeholder="Temporary worker name"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label>Worker *</Label>
                            <Select
                              value={entry.workerId?.toString() || ''}
                              onValueChange={(value) =>
                                handleWorkerSelect(
                                  entry.id,
                                  value ? parseInt(value, 10) : undefined
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose worker" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeWorkers.map((worker) => (
                                  <SelectItem key={worker.id} value={worker.id.toString()}>
                                    {worker.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Attendance *</Label>
                          <Select
                            value={entry.status === 'not_set' ? '' : entry.status}
                            onValueChange={(value: WorkStatus) =>
                              handleAttendanceStatusChange(entry.id, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full_day">Full Day</SelectItem>
                              <SelectItem value="half_day">Half Day</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Day Salary (₹) *</Label>
                          <Input
                            type="number"
                            min="0"
                            value={entry.salary}
                            onChange={(e) =>
                              updateAttendanceFormEntry(entry.id, 'salary', e.target.value)
                            }
                            placeholder="Enter salary"
                          />
                        </div>

                        {!entry.isTemporary && (
                          <div className="space-y-2">
                            <Label>Deduct From Advance (₹)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={entry.advanceDeduction}
                              onChange={(e) =>
                                updateAttendanceFormEntry(
                                  entry.id,
                                  'advanceDeduction',
                                  e.target.value
                                )
                              }
                              placeholder="0"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAttendanceModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAttendanceEntries} disabled={isSavingAttendanceEntries}>
              {isSavingAttendanceEntries && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Attendance Modal */}
      <Dialog
        open={!!editingAttendanceRecord}
        onOpenChange={(open) => !open && handleCloseEditAttendance()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit attendance</DialogTitle>
            <DialogDescription>Make corrections to this attendance entry.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={editAttendanceForm.date}
                onChange={(e) => handleEditFormChange('date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editAttendanceForm.status} onValueChange={handleEditStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_day">Full Day</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Work Type</Label>
              <Input
                value={editAttendanceForm.workType}
                onChange={(e) => handleEditFormChange('workType', e.target.value)}
                placeholder="e.g. other"
              />
            </div>
            <div className="space-y-2">
              <Label>Day Salary (₹)</Label>
              <Input
                type="number"
                min="0"
                disabled={editAttendanceForm.status === 'absent'}
                value={editAttendanceForm.status === 'absent' ? '0' : editAttendanceForm.salary}
                onChange={(e) => handleEditFormChange('salary', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editAttendanceForm.notes}
                onChange={(e) => handleEditFormChange('notes', e.target.value)}
                placeholder="Optional details"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditAttendance}>
              Cancel
            </Button>
            <Button onClick={handleSaveAttendanceEdit} disabled={isSavingAttendanceEdit}>
              {isSavingAttendanceEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Attendance Confirmation */}
      <AlertDialog
        open={!!attendanceRecordToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeletingAttendance) {
            setAttendanceRecordToDelete(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attendance?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the record for{' '}
              {attendanceRecordToDelete &&
                format(new Date(attendanceRecordToDelete.date), 'EEE, MMM d')}{' '}
              permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAttendance}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAttendance}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingAttendance}
            >
              {isDeletingAttendance && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Worker Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingWorker ? 'Edit Worker' : 'Add New Worker'}</DialogTitle>
            <DialogDescription>
              {editingWorker ? 'Update worker details' : 'Add a new worker to track'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Worker name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily_rate">Daily Rate (₹) *</Label>
              <Input
                id="daily_rate"
                type="number"
                min="0"
                step="10"
                value={formData.daily_rate}
                onChange={(e) =>
                  setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0 })
                }
                placeholder="300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advance_balance">Advance Taken (₹)</Label>
              <Input
                id="advance_balance"
                type="number"
                min="0"
                step="10"
                value={formData.advance_balance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    advance_balance: parseFloat(e.target.value) || 0
                  })
                }
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveWorker} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingWorker ? 'Update' : 'Add Worker'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteWorker} onOpenChange={() => setDeleteWorker(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Worker?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate {deleteWorker?.name}. Their history will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorker} className="bg-red-600 hover:bg-red-700">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Worker Detail Sheet */}
      <Sheet open={!!selectedWorker} onOpenChange={(open) => !open && handleCloseWorkerDetail()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedWorker && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedWorker.name}</SheetTitle>
                <SheetDescription>Worker details, attendance & transactions</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Worker Info */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <User className="h-8 w-8 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-lg font-semibold">{selectedWorker.name}</h2>
                          {!selectedWorker.is_active && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span>
                            <strong>₹{selectedWorker.daily_rate}</strong>/day
                          </span>
                          <span className="text-amber-600">
                            <strong>
                              ₹{(selectedWorker.advance_balance || 0).toLocaleString('en-IN')}
                            </strong>{' '}
                            advance
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setIsAdvanceModalOpen(true)}
                    variant="outline"
                    className="h-auto py-3"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Plus className="h-5 w-5" />
                      <span>Give Advance</span>
                    </div>
                  </Button>
                  <Button
                    onClick={() => setIsSettlementModalOpen(true)}
                    className="h-auto py-3 bg-green-600 hover:bg-green-700"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <IndianRupee className="h-5 w-5" />
                      <span>Settle Payment</span>
                    </div>
                  </Button>
                </div>

                {/* Tabs */}
                {loadingWorkerData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Tabs defaultValue="attendance" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="attendance">Attendance</TabsTrigger>
                      <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="attendance" className="mt-4">
                      {workerAttendance.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No records yet</p>
                      ) : (
                        <div className="space-y-2">
                          {workerAttendance.slice(0, 20).map((record) => (
                            <Card key={record.id}>
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">
                                      {format(new Date(record.date), 'EEE, MMM d')}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          record.work_status === 'full_day' &&
                                            'bg-green-50 text-green-700',
                                          record.work_status === 'half_day' &&
                                            'bg-amber-50 text-amber-700'
                                        )}
                                      >
                                        {record.work_status === 'full_day' ? 'Full' : 'Half'}
                                      </Badge>
                                      <span className="text-sm text-muted-foreground capitalize">
                                        {record.work_type.replace(/_/g, ' ')}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="font-medium">
                                    ₹
                                    {(
                                      (record.daily_rate_override ?? selectedWorker.daily_rate) *
                                      (record.work_status === 'full_day' ? 1 : 0.5)
                                    ).toLocaleString('en-IN')}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="transactions" className="mt-4">
                      {workerTransactions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          No transactions yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {workerTransactions.map((txn) => (
                            <Card key={txn.id}>
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={cn(
                                        'p-2 rounded-full',
                                        txn.type === 'advance_given' && 'bg-red-100',
                                        txn.type === 'advance_deducted' && 'bg-green-100',
                                        txn.type === 'payment' && 'bg-blue-100'
                                      )}
                                    >
                                      {txn.type === 'advance_given' ? (
                                        <ArrowUpRight className="h-4 w-4 text-red-600" />
                                      ) : txn.type === 'advance_deducted' ? (
                                        <ArrowDownLeft className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <IndianRupee className="h-4 w-4 text-blue-600" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        {txn.type === 'advance_given'
                                          ? 'Advance Given'
                                          : txn.type === 'advance_deducted'
                                            ? 'Advance Deducted'
                                            : 'Payment'}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {format(new Date(txn.date), 'MMM d, yyyy')}
                                      </p>
                                    </div>
                                  </div>
                                  <p
                                    className={cn(
                                      'font-semibold',
                                      txn.type === 'advance_given' && 'text-red-600',
                                      txn.type === 'advance_deducted' && 'text-green-600',
                                      txn.type === 'payment' && 'text-blue-600'
                                    )}
                                  >
                                    {txn.type === 'advance_given' ? '+' : '-'}₹
                                    {txn.amount.toLocaleString('en-IN')}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Give Advance Modal */}
      <Dialog open={isAdvanceModalOpen} onOpenChange={setIsAdvanceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Give Advance</DialogTitle>
            <DialogDescription>
              Current balance: ₹{(selectedWorker?.advance_balance || 0).toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={advanceNotes}
                onChange={(e) => setAdvanceNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdvanceModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGiveAdvance} disabled={isSavingAdvance}>
              {isSavingAdvance && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Give Advance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settlement Modal */}
      <Dialog open={isSettlementModalOpen} onOpenChange={setIsSettlementModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Settle Payment</DialogTitle>
            <DialogDescription>Calculate payment for {selectedWorker?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {farms.length > 1 && (
              <div className="space-y-2">
                <Label>Farm (optional)</Label>
                <Select
                  value={selectedFarmId?.toString() || 'all'}
                  onValueChange={(v) => {
                    setSelectedFarmId(v === 'all' ? null : parseInt(v, 10))
                    setSettlementCalculation(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All farms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Farms</SelectItem>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id.toString()}>
                        {farm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Period</Label>
              <Select
                value={settlementPeriod}
                onValueChange={(v) => {
                  setSettlementPeriod(v as typeof settlementPeriod)
                  setSettlementCalculation(null)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="last_week">Last Week</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settlementPeriod === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Input
                    type="date"
                    value={settlementStartDate}
                    onChange={(e) => {
                      setSettlementStartDate(e.target.value)
                      setSettlementCalculation(null)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Input
                    type="date"
                    value={settlementEndDate}
                    onChange={(e) => {
                      setSettlementEndDate(e.target.value)
                      setSettlementCalculation(null)
                    }}
                  />
                </div>
              </div>
            )}

            {!settlementCalculation && (
              <Button
                onClick={handleCalculateSettlement}
                disabled={isCalculating}
                className="w-full"
              >
                {isCalculating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Calculate
              </Button>
            )}

            {settlementCalculation && (
              <>
                <Card className="bg-gray-50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Period</span>
                      <span className="font-medium">
                        {format(new Date(settlementStartDate), 'MMM d')} -{' '}
                        {format(new Date(settlementEndDate), 'MMM d')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Days</span>
                      <span className="font-medium">{settlementCalculation.days_worked}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross</span>
                      <span className="font-medium">
                        ₹{settlementCalculation.gross_amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Advance Balance</span>
                      <span className="font-medium">
                        ₹{(selectedWorker?.advance_balance || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Advance Deduction (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    max={Math.min(
                      selectedWorker?.advance_balance || 0,
                      settlementCalculation.gross_amount
                    )}
                    value={advanceDeduction}
                    onChange={(e) => setAdvanceDeduction(e.target.value)}
                  />
                </div>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-green-800 font-medium">Net Payment</span>
                      <span className="text-2xl font-bold text-green-700">
                        ₹{netPayment.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSettlementModalOpen(false)
                setSettlementCalculation(null)
              }}
            >
              Cancel
            </Button>
            {settlementCalculation && (
              <Button
                onClick={handleConfirmSettlement}
                disabled={isConfirmingSettlement || netPayment < 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isConfirmingSettlement && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
