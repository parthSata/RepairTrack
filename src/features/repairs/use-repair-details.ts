'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  getRepairDetailsAccess,
  getRepairDetailsViewModel,
} from '@/features/repairs/repair-details-access'
import {
  useAddRepairNote,
  useReassignTechnician,
  useUpdateDiagnosis,
  useUpdateExpectedCompletionDate,
} from '@/features/repairs/mutations'
import {
  formatDateInputValue,
  isExpectedCompletionDateInPast,
  toDateInputValue,
} from '@/features/repairs/overdue'
import { useRepair, useTechnicians } from '@/features/repairs/queries'
import { useSession } from '@/lib/auth-client'

/**
 * Loads repair detail data and owns local edit state for assignment,
 * diagnosis, expected date, notes, and pricing unlock.
 */
export function useRepairDetails(id: string) {
  const { data: session } = useSession()
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? 'OWNER'
  const userId = session?.user?.id

  const { data: repair, isLoading, isError, error, refetch } = useRepair(id)
  const { data: technicians } = useTechnicians()

  const reassignMutation = useReassignTechnician(id)
  const diagnosisMutation = useUpdateDiagnosis(id)
  const addNoteMutation = useAddRepairNote(id)
  const updateExpectedDateMutation = useUpdateExpectedCompletionDate(id)

  const [selectedTechId, setSelectedTechId] = React.useState('')
  const [diagnosisText, setDiagnosisText] = React.useState('')
  const [prevRepairId, setPrevRepairId] = React.useState<string | null>(null)
  const [isDiagnosisEditing, setIsDiagnosisEditing] = React.useState(false)
  const [newNoteText, setNewNoteText] = React.useState('')
  const [isEditingExpectedDate, setIsEditingExpectedDate] = React.useState(false)
  const [expectedDateValue, setExpectedDateValue] = React.useState('')
  const [isPricingUnlocked, setIsPricingUnlocked] = React.useState(false)

  if (repair && prevRepairId !== repair.id) {
    setPrevRepairId(repair.id)
    setSelectedTechId(repair.assignedTechnicianId ?? '')
    setDiagnosisText(repair.diagnosis ?? '')
    setIsPricingUnlocked(false)
    setIsDiagnosisEditing(false)
    setIsEditingExpectedDate(false)
    setNewNoteText('')
    setExpectedDateValue(toDateInputValue(repair.expectedCompletionDate))
  }

  const access = repair ? getRepairDetailsAccess(userRole, userId, repair) : null
  const view = repair ? getRepairDetailsViewModel(repair, userRole, isPricingUnlocked) : null

  const handleReassign = async () => {
    await reassignMutation.mutateAsync({ technicianId: selectedTechId || null })
    await refetch()
  }

  const handleSaveDiagnosis = async () => {
    await diagnosisMutation.mutateAsync({ diagnosis: diagnosisText })
    setIsDiagnosisEditing(false)
    await refetch()
  }

  const handleCancelDiagnosisEdit = () => {
    setDiagnosisText(repair?.diagnosis ?? '')
    setIsDiagnosisEditing(false)
  }

  const handleSaveExpectedDate = async () => {
    if (expectedDateValue && isExpectedCompletionDateInPast(expectedDateValue)) {
      toast.error('Expected completion date must not be in the past')
      return
    }

    await updateExpectedDateMutation.mutateAsync({
      expectedCompletionDate: expectedDateValue ? new Date(expectedDateValue).toISOString() : null,
    })
    setIsEditingExpectedDate(false)
    await refetch()
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim()) return
    await addNoteMutation.mutateAsync({ note: newNoteText.trim() })
    setNewNoteText('')
    await refetch()
  }

  const handleHoldReassign = async (technicianId: string) => {
    await reassignMutation.mutateAsync({ technicianId })
    setSelectedTechId(technicianId)
  }

  return {
    id,
    userRole,
    userId,
    repair,
    isLoading,
    isError,
    error,
    refetch,
    technicians: technicians ?? [],
    access,
    view,
    todayDateMin: formatDateInputValue(),
    selectedTechId,
    setSelectedTechId,
    diagnosisText,
    setDiagnosisText,
    isDiagnosisEditing,
    setIsDiagnosisEditing,
    newNoteText,
    setNewNoteText,
    isEditingExpectedDate,
    setIsEditingExpectedDate,
    expectedDateValue,
    setExpectedDateValue,
    setIsPricingUnlocked,
    reassignMutation,
    diagnosisMutation,
    addNoteMutation,
    updateExpectedDateMutation,
    handleReassign,
    handleSaveDiagnosis,
    handleCancelDiagnosisEdit,
    handleSaveExpectedDate,
    handleAddNote,
    handleHoldReassign,
  }
}

export type RepairDetailsController = ReturnType<typeof useRepairDetails>
