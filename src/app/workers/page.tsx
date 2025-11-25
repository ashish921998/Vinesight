'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  WorkType,
  TemporaryWorkerEntry
} from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { createClient } from '@/lib/supabase'
import { WorkersListView } from '@/components/workers/WorkersListView'
import { AttendanceView } from '@/components/workers/AttendanceView'
import { AnalyticsView } from '@/components/workers/AnalyticsView'
import { FarmsMultiSelect } from '@/components/farms/FarmsMultiSelect'
import { AttendanceSheet } from '@/components/workers/AttendanceSheet'

interface Farm {
  id: number
  name: string
}

interface AttendanceFormEntry {
  id: string
  isTemporary: boolean
  workerId?: number
  tempName: string
  status: WorkStatus
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
  const [viewMode, setViewMode] = useState<'workers' | 'attendance' | 'analytics'>('attendance')

  // Worker modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [deleteWorker, setDeleteWorker] = useState<Worker | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<WorkerCreateInput>({
    name: '',
    daily_rate: 0,
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
  const [settlementWorker, setSettlementWorker] = useState<Worker | null>(null)
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
  const [totalSalaryInput, setTotalSalaryInput] = useState('')
  const [advanceDeduction, setAdvanceDeduction] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [isConfirmingSettlement, setIsConfirmingSettlement] = useState(false)

  // Attendance tab state
  const [attendanceFarmIds, setAttendanceFarmIds] = useState<number[]>([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [attendanceSaveFunction, setAttendanceSaveFunction] = useState<{
    fn: () => Promise<void>
    hasChanges: boolean
    isSaving: boolean
  } | null>(null)
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
  const [workTypes, setWorkTypes] = useState<WorkType[]>([])
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
        setAttendanceFarmIds([farmsResult.data[0].id])
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

  // Load work types on mount
  useEffect(() => {
    const loadWorkTypes = async () => {
      try {
        const types = await LaborService.getWorkTypes()
        setWorkTypes(types)
      } catch (error) {
        console.error('Error loading work types:', error)
        toast.error('Failed to load work types')
      }
    }
    loadWorkTypes()
  }, [])

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
        attendanceQuery = attendanceQuery.contains('farm_ids', [analyticsFarmId])
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
    if (viewMode === 'attendance' && attendanceFarmIds.length === 0 && farms.length > 0) {
      setAttendanceFarmIds([farms[0].id])
    }
  }, [viewMode, attendanceFarmIds, farms])

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

  const handleOpenAddModal = () => {
    setFormData({ name: '', daily_rate: 0, advance_balance: 0 })
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
      toast.success('Worker deleted successfully')
      setDeleteWorker(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting worker:', error)
      toast.error('Failed to delete worker')
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
    if (!settlementWorker || !settlementStartDate || !settlementEndDate) return

    setIsCalculating(true)
    try {
      const calculation = await LaborService.calculateSettlement(
        settlementWorker.id,
        selectedFarmId,
        settlementStartDate,
        settlementEndDate
      )
      setSettlementCalculation(calculation)
      // Pre-fill total salary with calculated gross amount (editable)
      setTotalSalaryInput(calculation.gross_amount.toString())
      // Pre-fill advance deduction with 0 (user fills this)
      setAdvanceDeduction('0')
    } catch (error) {
      console.error('Error calculating settlement:', error)
      toast.error('Failed to calculate settlement')
    } finally {
      setIsCalculating(false)
    }
  }

  const handleConfirmSettlement = async () => {
    if (!settlementWorker || !settlementCalculation) return

    const totalSalary = parseFloat(totalSalaryInput) || 0
    const deduction = parseFloat(advanceDeduction) || 0

    if (totalSalary < 0) {
      toast.error('Total salary cannot be negative')
      return
    }
    if (deduction < 0) {
      toast.error('Advance deduction cannot be negative')
      return
    }
    if (deduction > (settlementWorker.advance_balance || 0)) {
      toast.error('Deduction exceeds available advance balance')
      return
    }
    if (deduction > totalSalary) {
      toast.error('Deduction cannot exceed total salary')
      return
    }

    setIsConfirmingSettlement(true)
    try {
      const netPayment = totalSalary - deduction
      await LaborService.createSettlement(
        {
          worker_id: settlementWorker.id,
          farm_id: selectedFarmId || undefined,
          period_start: settlementStartDate,
          period_end: settlementEndDate,
          days_worked: settlementCalculation.days_worked,
          gross_amount: totalSalary,
          advance_deducted: deduction,
          net_payment: netPayment,
          notes: ''
        },
        true
      )
      toast.success(`Settlement confirmed! Net payment: ₹${netPayment.toLocaleString('en-IN')}`)
      setIsSettlementModalOpen(false)
      setSettlementCalculation(null)
      setSettlementWorker(null)
      setTotalSalaryInput('')
      setAdvanceDeduction('')
      fetchData()
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
      status: 'full_day',
      salary: !isTemporary && defaultWorker ? defaultWorker.daily_rate.toString() : '',
      advanceDeduction: ''
    }
  }

  const handleOpenAttendanceModal = () => {
    if (farms.length === 0) {
      toast.error('Add a farm before recording attendance')
      return
    }
    setAttendanceFarmIds(attendanceFarmIds.length > 0 ? attendanceFarmIds : [farms[0].id])
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

  const statusToFraction = (status: WorkStatus) => {
    if (status === 'half_day') return 0.5
    return 1 // full_day is the default
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
    if (attendanceFarmIds.length === 0) {
      toast.error('Please select at least one farm')
      return
    }
    if (attendanceFormEntries.length === 0) {
      toast.error('Add at least one worker')
      return
    }

    const date = selectedDate
    const deductionNote = `Attendance deduction for ${format(new Date(date), 'dd MMM yyyy')}`
    const tempOperations: Promise<any>[] = []
    const deductionOperations: Promise<any>[] = []

    // Validate all entries first
    for (const entry of attendanceFormEntries) {
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
      } else {
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
      }
    }

    setIsSavingAttendanceEntries(true)
    try {
      const attendancePayload: Parameters<typeof LaborService.bulkCreateAttendance>[0] = []

      // Process each entry once with all selected farms
      for (const entry of attendanceFormEntries) {
        const salaryValue = parseFloat(entry.salary)

        if (entry.isTemporary) {
          // Temporary workers still need separate entries per farm
          const hoursWorked = entry.status === 'full_day' ? 8 : 4
          for (const farmId of attendanceFarmIds) {
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
          }
          continue
        }

        const worker = workers.find((w) => w.id === entry.workerId)
        const dayFraction = statusToFraction(entry.status)
        const perDayRate = salaryValue / dayFraction
        const defaultRate = worker?.daily_rate
        const attendanceRecord: WorkerAttendanceCreateInput = {
          worker_id: entry.workerId!,
          farm_ids: attendanceFarmIds, // Array of all selected farm IDs
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

        const deductionValue = parseFloat(entry.advanceDeduction)
        if (!Number.isNaN(deductionValue) && deductionValue > 0) {
          // Deductions still need one entry per farm
          // Handle floating-point precision: assign remainder to last farm to ensure sum equals original
          const baseAmount = Math.floor((deductionValue / attendanceFarmIds.length) * 100) / 100
          const remainder = deductionValue - baseAmount * (attendanceFarmIds.length - 1)
          for (let i = 0; i < attendanceFarmIds.length; i++) {
            const farmId = attendanceFarmIds[i]
            const amount = i === attendanceFarmIds.length - 1 ? remainder : baseAmount
            deductionOperations.push(
              LaborService.createTransaction({
                worker_id: entry.workerId!,
                farm_id: farmId,
                date,
                type: 'advance_deducted',
                amount,
                notes: deductionNote
              })
            )
          }
        }
      }

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
    ? (parseFloat(totalSalaryInput) || 0) - (parseFloat(advanceDeduction) || 0)
    : 0

  // Memoized callbacks for AttendanceSheet to prevent infinite loops
  const handleAttendanceSaved = useCallback(() => {
    setIsAttendanceModalOpen(false)
    fetchData()
    if (attendanceHistoryWorkerId) {
      loadAttendanceHistory(attendanceHistoryWorkerId)
    }
  }, [attendanceHistoryWorkerId, fetchData, loadAttendanceHistory])

  const handleSaveFunctionUpdate = useCallback(
    (saveFn: () => Promise<void>, hasChanges: boolean, isSaving: boolean) => {
      setAttendanceSaveFunction({ fn: saveFn, hasChanges, isSaving })
    },
    []
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
        {/* Summary Stats */}
        <Card className="rounded-2xl mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-2xl font-bold break-words">{activeWorkers}</p>
                  <p className="text-xs text-muted-foreground">Active Workers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-2xl font-bold break-words">
                    ₹{totalAdvanceBalance.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Advance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  onClick={() => attendanceSaveFunction?.fn()}
                  disabled={!attendanceSaveFunction?.hasChanges || attendanceSaveFunction?.isSaving}
                  size="lg"
                  className="w-full rounded-full bg-primary hover:bg-primary/90 text-white"
                >
                  {attendanceSaveFunction?.isSaving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Save Changes
                </Button>
              ) : viewMode === 'workers' ? (
                <div className="flex gap-2">
                  <Button
                    onClick={handleOpenAddModal}
                    size="lg"
                    className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Worker
                  </Button>
                  <Button
                    onClick={() => setIsSettlementModalOpen(true)}
                    size="lg"
                    className="flex-1 rounded-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <IndianRupee className="h-4 w-4 mr-1" />
                    Settle
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {viewMode === 'workers' && (
          <WorkersListView
            workers={workers}
            loading={loading}
            onOpenAddModal={handleOpenAddModal}
            onOpenWorkerDetail={handleOpenWorkerDetail}
            onOpenEditModal={handleOpenEditModal}
            onDeleteWorker={setDeleteWorker}
          />
        )}
        {viewMode === 'attendance' && (
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <AttendanceSheet
                farms={farms}
                workers={workers}
                onAttendanceSaved={handleAttendanceSaved}
                onSaveFunction={handleSaveFunctionUpdate}
              />
            </CardContent>
          </Card>
        )}
        {viewMode === 'analytics' && (
          <AnalyticsView
            farms={farms}
            analyticsLoading={analyticsLoading}
            analyticsStartDate={analyticsStartDate}
            analyticsEndDate={analyticsEndDate}
            analyticsFarmId={analyticsFarmId}
            fixedAnalytics={fixedAnalytics}
            tempAnalytics={tempAnalytics}
            showFixedDetails={showFixedDetails}
            selectedFixedWorker={selectedFixedWorker}
            showTempDetails={showTempDetails}
            selectedTempWorker={selectedTempWorker}
            onStartDateChange={setAnalyticsStartDate}
            onEndDateChange={setAnalyticsEndDate}
            onFarmIdChange={setAnalyticsFarmId}
            onToggleFixedDetails={() => setShowFixedDetails((prev) => !prev)}
            onSelectedFixedWorkerChange={setSelectedFixedWorker}
            onToggleTempDetails={() => setShowTempDetails((prev) => !prev)}
            onSelectedTempWorkerChange={setSelectedTempWorker}
          />
        )}
      </div>

      {/* Record Attendance Modal */}
      <Dialog open={isAttendanceModalOpen} onOpenChange={setIsAttendanceModalOpen}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Record Attendance</DialogTitle>
            <DialogDescription>
              Click on cells to mark attendance: Full Day (F), Half Day (H), Absent (A), or Not Set
              (-).
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <AttendanceSheet
              farms={farms}
              workers={workers}
              onAttendanceSaved={handleAttendanceSaved}
              onSaveFunction={handleSaveFunctionUpdate}
            />
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-white">
            <Button variant="outline" onClick={() => setIsAttendanceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => attendanceSaveFunction?.fn()}
              disabled={!attendanceSaveFunction?.hasChanges || attendanceSaveFunction?.isSaving}
            >
              {attendanceSaveFunction?.isSaving && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
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
              <Select
                value={editAttendanceForm.workType}
                onValueChange={(value) => handleEditFormChange('workType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent>
                  {workTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <AlertDialogTitle>Delete Worker?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteWorker?.name} and all their associated records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorker} className="bg-red-600 hover:bg-red-700">
              Delete
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
                    onClick={() => {
                      setSettlementWorker(selectedWorker)
                      setIsSettlementModalOpen(true)
                    }}
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
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Settle Payment</DialogTitle>
            <DialogDescription>
              {settlementWorker
                ? `Calculate payment for ${settlementWorker.name}`
                : 'Select a worker and period to calculate payment'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Worker Select - Required */}
            <div className="space-y-2">
              <Label>Worker *</Label>
              <Select
                value={settlementWorker?.id.toString() || ''}
                onValueChange={(v) => {
                  const worker = workers.find((w) => w.id === parseInt(v, 10))
                  setSettlementWorker(worker || null)
                  setSettlementCalculation(null)
                  setTotalSalaryInput('')
                  setAdvanceDeduction('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers
                    .filter((w) => w.is_active)
                    .map((worker) => (
                      <SelectItem key={worker.id} value={worker.id.toString()}>
                        {worker.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Farm Select - Optional */}
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

            {/* Period Select - Required */}
            <div className="space-y-2">
              <Label>Period *</Label>
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
                disabled={isCalculating || !settlementWorker}
                className="w-full"
              >
                {isCalculating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Calculate
              </Button>
            )}

            {settlementCalculation && (
              <>
                {/* Summary Card */}
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
                      <span className="text-muted-foreground">Days Worked</span>
                      <span className="font-medium">{settlementCalculation.days_worked}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calculated Gross</span>
                      <span className="font-medium">
                        ₹{settlementCalculation.gross_amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Advance Balance</span>
                      <span className="font-medium">
                        ₹{(settlementWorker?.advance_balance || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Editable Total Salary */}
                <div className="space-y-2">
                  <Label>Total Salary (₹) *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={totalSalaryInput}
                    onChange={(e) => setTotalSalaryInput(e.target.value)}
                    placeholder="Enter total salary to pay"
                  />
                  <p className="text-xs text-muted-foreground">
                    Pre-filled with calculated gross. You can edit this amount.
                  </p>
                </div>

                {/* Editable Cut from Advance */}
                <div className="space-y-2">
                  <Label>Cut from Advance (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    max={settlementWorker?.advance_balance || 0}
                    value={advanceDeduction}
                    onChange={(e) => setAdvanceDeduction(e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max: ₹{(settlementWorker?.advance_balance || 0).toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Net Payment Display */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-green-800 font-medium">Net Payment</span>
                      <span className="text-2xl font-bold text-green-700">
                        ₹{netPayment.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">Total Salary - Cut from Advance</p>
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
                setSettlementWorker(null)
                setTotalSalaryInput('')
                setAdvanceDeduction('')
              }}
            >
              Cancel
            </Button>
            {settlementCalculation && (
              <Button
                onClick={handleConfirmSettlement}
                disabled={isConfirmingSettlement || netPayment < 0 || !totalSalaryInput}
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
