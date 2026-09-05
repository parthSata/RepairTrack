'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  HardDrive,
  FileText,
  MessageSquare,
  History,
  User,
  Wrench,
  UserCheck,
  AlertCircle,
  AlertTriangle,
  Plus,
  Calendar,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Not set'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return 'Not set'
  }
}
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ConditionBadge, DeviceTypeIcon, ModelVerificationBadge } from '@/components/devices/device-table'
import { ModelConfirmationCard } from './model-confirmation-card'
import { CustomerTrackingSection } from './customer-tracking-section'
import { StatusChangeControl } from './status-change-control'
import { ApprovalEstimateBreakdown } from './approval-estimate-summary'
import { RequestApprovalControl } from './request-approval-control'
import { ApprovalStatusBanner } from './approval-status-badge'
import { TechnicianCombobox } from './technician-combobox'
import { AssignmentOnHoldCard } from './assignment-on-hold-card'
import { useRepair, useTechnicians } from '@/features/repairs/queries'
import {
  useAddRepairNote,
  useReassignTechnician,
  useUpdateDiagnosis,
  useUpdateEstimatedCost,
  useUpdateExpectedCompletionDate,
} from '@/features/repairs/mutations'
import { formatINRFromPaise, formatRupeesInputValue, getApprovalEstimateBreakdownRupees, parseRupeesInput, rupeesToPaise } from '@/features/repairs/money'
import { formatDateInputValue, isExpectedCompletionDateInPast } from '@/features/repairs/overdue'
import { useSession } from '@/lib/auth-client'
import { toast } from 'sonner'

export function RepairDetails({ id }: { id: string }) {
  const { data: session } = useSession()
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? 'OWNER'
  const userId = session?.user?.id

  const { data: repair, isLoading, isError, error, refetch } = useRepair(id)
  const { data: technicians } = useTechnicians()

  const reassignMutation = useReassignTechnician(id)
  const diagnosisMutation = useUpdateDiagnosis(id)
  const estimatedCostMutation = useUpdateEstimatedCost(id)
  const addNoteMutation = useAddRepairNote(id)
  const updateExpectedDateMutation = useUpdateExpectedCompletionDate(id)

  const [selectedTechId, setSelectedTechId] = React.useState<string>('')
  const [diagnosisText, setDiagnosisText] = React.useState<string>('')
  const [prevRepairId, setPrevRepairId] = React.useState<string | null>(null)
  const [isDiagnosisEditing, setIsDiagnosisEditing] = React.useState<boolean>(false)
  const [isEstimatedCostEditing, setIsEstimatedCostEditing] = React.useState<boolean>(false)
  const [estimatedCostValue, setEstimatedCostValue] = React.useState<string>('')
  const [newNoteText, setNewNoteText] = React.useState<string>('')
  const [isEditingExpectedDate, setIsEditingExpectedDate] = React.useState<boolean>(false)
  const [expectedDateValue, setExpectedDateValue] = React.useState<string>('')

  if (repair && prevRepairId !== repair.id) {
    setPrevRepairId(repair.id)
    setSelectedTechId(repair.assignedTechnicianId ?? '')
    setDiagnosisText(repair.diagnosis ?? '')
    const pendingBreakdown =
      repair.approval?.status === 'PENDING'
        ? getApprovalEstimateBreakdownRupees(repair.approval)
        : null
    setEstimatedCostValue(
      pendingBreakdown
        ? formatRupeesInputValue(rupeesToPaise(pendingBreakdown.revised))
        : formatRupeesInputValue(repair.estimatedCost),
    )
    if (repair.expectedCompletionDate) {
      const dateObj = new Date(repair.expectedCompletionDate)
      if (!isNaN(dateObj.getTime())) {
        const yyyy = dateObj.getFullYear()
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
        const dd = String(dateObj.getDate()).padStart(2, '0')
        setExpectedDateValue(`${yyyy}-${mm}-${dd}`)
      } else {
        setExpectedDateValue('')
      }
    } else {
      setExpectedDateValue('')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !repair) {
    return (
      <div className="space-y-4">
        <Link href="/repairs">
          <Button variant="ghost" className="h-8 px-3 text-xs gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Repair Tickets
          </Button>
        </Link>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive space-y-2">
          <AlertCircle className="h-6 w-6 mx-auto" />
          <p className="font-semibold">
            {error instanceof Error ? error.message : 'Repair ticket not found or access denied.'}
          </p>
          <p className="text-xs text-muted-foreground">
            If you are signed in as a Technician, you can only view tickets assigned to you.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            Retry Loading
          </Button>
        </div>
      </div>
    )
  }

  const isAssignedTechnician = repair.assignedTechnicianId === userId
  const canEditDiagnosisAndNotes = ['OWNER', 'STAFF'].includes(userRole) || isAssignedTechnician
  const canReassignTechnician = ['OWNER', 'STAFF'].includes(userRole)
  const canShowCustomerTracking = ['OWNER', 'STAFF'].includes(userRole)
  const canEditExpectedDate = canEditDiagnosisAndNotes
  const todayDateMin = formatDateInputValue()

  const showModelConfirmationCard =
    repair.status === 'DIAGNOSING' &&
    repair.device.modelVerified === false &&
    Boolean(repair.assignedTechnicianId)

  const pendingApprovalBreakdown =
    repair.approval?.status === 'PENDING'
      ? getApprovalEstimateBreakdownRupees(repair.approval)
      : null

  const handleReassign = async () => {
    const techId = selectedTechId || null
    await reassignMutation.mutateAsync({ technicianId: techId })
    refetch()
  }

  const handleSaveDiagnosis = async () => {
    await diagnosisMutation.mutateAsync({ diagnosis: diagnosisText })
    setIsDiagnosisEditing(false)
    refetch()
  }

  const handleSaveEstimatedCost = async () => {
    const parsed = parseRupeesInput(estimatedCostValue)
    if (estimatedCostValue.trim() && parsed === null) {
      toast.error('Enter a valid estimated cost in rupees')
      return
    }

    await estimatedCostMutation.mutateAsync({ estimatedCost: parsed })
    setIsEstimatedCostEditing(false)
    refetch()
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
    refetch()
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim()) return
    await addNoteMutation.mutateAsync({ note: newNoteText.trim() })
    setNewNoteText('')
    refetch()
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {/* Top Header Navigation */}
      <header className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/repairs" className="w-fit">
          <Button
            variant="ghost"
            className="h-9 px-3 text-xs gap-2 text-muted-foreground hover:text-foreground -ml-3"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to Repair Tickets
          </Button>
        </Link>

        <span className="w-fit max-w-full truncate font-mono text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border">
          Ticket #{repair.ticketNumber}
        </span>
      </header>

      {/* Model Confirmation Card (if unverified device in DIAGNOSING state) */}
      {showModelConfirmationCard && (
        <ModelConfirmationCard device={repair.device} onConfirmed={() => refetch()} />
      )}

      {/* Main Ticket Overview Header Card */}
      <Card className="w-full min-w-0">
        <CardContent className="flex w-full min-w-0 flex-col gap-6 pt-6">
          <div className="flex w-full min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div className="flex min-w-0 flex-col gap-3">
                <h1 className="text-xl font-bold tracking-tight text-foreground break-words sm:text-2xl md:text-3xl">
                  Repair Ticket
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-semibold text-xs uppercase px-2.5 py-0.5">
                    {repair.status.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant="secondary" className="font-medium text-xs">
                    {repair.priority} Priority
                  </Badge>
                </div>
              </div>

              {repair.approval ? <ApprovalStatusBanner approval={repair.approval} /> : null}

              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>
                  Created by{' '}
                  <strong className="text-foreground font-semibold">
                    {repair.creator?.name ?? 'Shop User'}
                  </strong>
                  {repair.creator?.role && (
                    <span className="ml-1.5 text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded border border-border">
                      {repair.creator.role}
                    </span>
                  )}
                  {' · '}
                  {formatDateTime(repair.createdAt)}
                </span>
              </div>
            </div>

            {/* Status Control Box */}
            <div className="flex w-full min-w-0 shrink-0 flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4 lg:max-w-sm">
              <StatusChangeControl
                repairId={repair.id}
                currentStatus={repair.status}
                assignedTechnicianId={repair.assignedTechnicianId}
                onStatusUpdated={() => refetch()}
              />
              <RequestApprovalControl
                repairId={repair.id}
                diagnosis={repair.diagnosis}
                estimatedCost={repair.estimatedCost}
                approval={repair.approval}
                currentStatus={repair.status}
                assignedTechnicianId={repair.assignedTechnicianId}
                onRequested={() => refetch()}
              />
            </div>
          </div>

          {/* Info cards grid */}
          <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
            {/* Linked Device */}
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5" />
                Linked device
              </span>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border shrink-0">
                  <DeviceTypeIcon type={repair.device.deviceType} />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="font-semibold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                    <span>{repair.device.brand}</span>
                    {repair.device.model ? (
                      <span>{repair.device.model}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic font-normal">Unconfirmed</span>
                    )}
                    <ModelVerificationBadge
                      modelVerified={repair.device.modelVerified}
                      modelVerificationOverridden={repair.device.modelVerificationOverridden}
                    />
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    <span className="capitalize">{repair.device.deviceType.toLowerCase()}</span>
                    <ConditionBadge condition={repair.device.condition} />
                  </div>
                  {repair.device.serialNumber && (
                    <span className="text-[11px] text-muted-foreground font-mono mt-0.5 break-all">
                      S/N: {repair.device.serialNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Linked Customer */}
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Customer
              </span>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-foreground">{repair.customer.name}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{repair.customer.phone}</span>
                {repair.customer.email && (
                  <span className="text-xs text-muted-foreground break-all">{repair.customer.email}</span>
                )}
              </div>
            </div>

            {/* Technician Assignment */}
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                Assigned technician
              </span>

              {repair.currentAssignment?.status === 'ON_HOLD' && (
                <div className="space-y-2">
                  <Badge variant="warning">Assignment On Hold</Badge>
                  <AssignmentOnHoldCard
                    assignment={repair.currentAssignment}
                    technicians={technicians ?? []}
                    canManage={canReassignTechnician}
                    isReassignPending={reassignMutation.isPending}
                    onReassigned={async (technicianId) => {
                      await reassignMutation.mutateAsync({ technicianId })
                      setSelectedTechId(technicianId)
                    }}
                  />
                </div>
              )}

              {canReassignTechnician ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="w-full sm:flex-1">
                    <TechnicianCombobox
                      technicians={technicians ?? []}
                      value={selectedTechId || null}
                      allowUnassigned
                      onChange={(id) => setSelectedTechId(id ?? '')}
                      aria-label="Assign technician"
                    />
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleReassign}
                    disabled={
                      reassignMutation.isPending ||
                      (selectedTechId || null) === (repair.assignedTechnicianId || null)
                    }
                    className="h-9 w-full text-xs px-3 sm:w-auto"
                  >
                    {reassignMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              ) : (
                <div className="text-sm font-medium text-foreground">
                  {repair.assignedTechnician ? (
                    <span className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {repair.assignedTechnician.name}
                    </span>
                  ) : (
                    <span className="text-xs italic text-muted-foreground">Unassigned</span>
                  )}
                </div>
              )}
            </div>

            {/* Expected Completion Date */}
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Expected completion
              </span>

              {canEditExpectedDate ? (
                isEditingExpectedDate ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      type="date"
                      value={expectedDateValue}
                      min={todayDateMin}
                      onChange={(e) => setExpectedDateValue(e.target.value)}
                      className="h-9 text-xs flex-1 px-2"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingExpectedDate(false)}
                        className="h-9 flex-1 text-xs px-2 sm:flex-none"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveExpectedDate}
                        disabled={updateExpectedDateMutation.isPending}
                        className="h-9 flex-1 text-xs px-2.5 sm:flex-none"
                      >
                        {updateExpectedDateMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {formatDate(repair.expectedCompletionDate)}
                      </span>
                      {repair.isOverdue ? (
                        <Badge variant="warning" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Overdue
                        </Badge>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingExpectedDate(true)}
                      className="h-8 w-full text-xs px-2 gap-1 text-muted-foreground hover:text-foreground sm:w-auto"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                )
              ) : (
                <div className="text-sm font-semibold text-foreground flex items-center gap-2 flex-wrap">
                  <span>{formatDate(repair.expectedCompletionDate)}</span>
                  {repair.isOverdue ? (
                    <Badge variant="warning" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Overdue
                    </Badge>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Issue & Initial Physical Condition */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5" />
                Problem description
              </span>
              <p className="text-sm text-foreground leading-relaxed">
                {repair.problemDescription || repair.issueDescription || 'No description provided.'}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Initial condition & accessories
              </span>
              <p className="text-sm text-foreground leading-relaxed">
                {repair.initialCondition || 'No condition notes recorded.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {canShowCustomerTracking ? (
        <CustomerTrackingSection
          repairId={repair.id}
          trackingToken={repair.trackingToken}
          onRegenerated={() => refetch()}
        />
      ) : null}

      {/* Diagnosis Section */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Technical Diagnosis
            </h3>

            {canEditDiagnosisAndNotes && !isDiagnosisEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDiagnosisEditing(true)}
                className="h-8 text-xs"
              >
                Edit Diagnosis
              </Button>
            )}
          </div>

          {isDiagnosisEditing ? (
            <div className="space-y-3">
              <Textarea
                placeholder="Enter technician diagnosis, findings, or required fixes..."
                value={diagnosisText}
                onChange={(e) => setDiagnosisText(e.target.value)}
                rows={4}
                className="text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDiagnosisText(repair.diagnosis ?? '')
                    setIsDiagnosisEditing(false)
                  }}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveDiagnosis}
                  disabled={diagnosisMutation.isPending}
                  className="h-8 text-xs"
                >
                  {diagnosisMutation.isPending ? 'Saving...' : 'Save Diagnosis'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground bg-muted/20 p-4 rounded-md border border-border">
              {repair.diagnosis ? (
                repair.diagnosis
              ) : (
                <span className="text-muted-foreground italic">
                  No technician diagnosis recorded yet.
                </span>
              )}
            </p>
          )}

          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                {pendingApprovalBreakdown ? 'Repair estimate' : 'Original Estimate'}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">(₹ Rupees)</span>
              </h4>
              {canEditDiagnosisAndNotes && !isEstimatedCostEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEstimatedCostValue(
                      pendingApprovalBreakdown
                        ? formatRupeesInputValue(rupeesToPaise(pendingApprovalBreakdown.revised))
                        : formatRupeesInputValue(repair.estimatedCost),
                    )
                    setIsEstimatedCostEditing(true)
                  }}
                  className="h-8 w-full text-xs gap-1.5 sm:w-auto"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {pendingApprovalBreakdown ? 'Edit revised total' : 'Edit'}
                </Button>
              )}
            </div>

            {pendingApprovalBreakdown ? (
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Breakdown sent to the customer. Editing the revised total updates their tracking
                page.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Set at intake; additional costs are added when requesting approval.
              </p>
            )}

            {isEstimatedCostEditing ? (
              <div className="space-y-3">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={pendingApprovalBreakdown ? 'Revised total e.g. 10000' : 'e.g. 1500'}
                  value={estimatedCostValue}
                  onChange={(e) => setEstimatedCostValue(e.target.value)}
                  className="text-sm w-full max-w-sm"
                />
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEstimatedCostValue(
                        pendingApprovalBreakdown
                          ? formatRupeesInputValue(rupeesToPaise(pendingApprovalBreakdown.revised))
                          : formatRupeesInputValue(repair.estimatedCost),
                      )
                      setIsEstimatedCostEditing(false)
                    }}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEstimatedCost}
                    disabled={estimatedCostMutation.isPending}
                    className="h-8 text-xs"
                  >
                    {estimatedCostMutation.isPending ? 'Saving...' : 'Save Cost'}
                  </Button>
                </div>
              </div>
            ) : pendingApprovalBreakdown ? (
              <ApprovalEstimateBreakdown
                variant="default"
                diagnosis={repair.diagnosis?.trim() || 'No diagnosis recorded.'}
                initialEstimateRupees={pendingApprovalBreakdown.initial}
                additionalCostRupees={pendingApprovalBreakdown.additional}
                revisedTotalRupees={pendingApprovalBreakdown.revised}
              />
            ) : (
              <div
                className={
                  repair.estimatedCost !== null
                    ? 'rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-4 dark:border-amber-800 dark:bg-amber-950/30'
                    : undefined
                }
              >
                {repair.estimatedCost !== null ? (
                  <p className="text-2xl font-bold text-amber-950 dark:text-amber-50">
                    {formatINRFromPaise(repair.estimatedCost)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Not set — enter amount in rupees before requesting approval
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Repair Notes Section (Append-only) */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Repair Notes
          </h3>

          {/* Add Note Form */}
          {canEditDiagnosisAndNotes && (
            <form onSubmit={handleAddNote} className="space-y-3">
              <Textarea
                placeholder="Add a new repair note..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={addNoteMutation.isPending || !newNoteText.trim()}
                  className="h-8 text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                </Button>
              </div>
            </form>
          )}

          {/* Notes List */}
          <div className="space-y-3">
            {repair.notes && repair.notes.length > 0 ? (
              repair.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3.5 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {note.author.name}
                      {note.author.role && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded border border-border">
                          {note.author.role}
                        </span>
                      )}
                    </span>
                    <span>{formatDateTime(note.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap pl-5">{note.note}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                No repair notes recorded.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline History */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Status History Timeline
          </h3>

          <div className="relative pl-6 border-l-2 border-border space-y-6 my-2">
            {repair.statusHistory && repair.statusHistory.length > 0 ? (
              repair.statusHistory.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline point icon */}
                  <div className="absolute -left-7.75 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background border-2 border-primary text-primary">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-bold text-foreground">
                        {item.fromStatus
                          ? `${item.fromStatus.replace(/_/g, ' ')} → ${item.toStatus.replace(
                              /_/g,
                              ' ',
                            )}`
                          : `Status set to ${item.toStatus.replace(/_/g, ' ')}`}
                      </span>

                      <span className="text-muted-foreground">•</span>

                      <span className="text-muted-foreground">
                        {item.actorType === 'CUSTOMER' ? (
                          <>Changed by <strong className="text-foreground">Customer</strong></>
                        ) : item.changedBy?.name ? (
                          <>
                            Changed by{' '}
                            <strong className="text-foreground">{item.changedBy.name}</strong>
                            {item.changedBy.role ? ` (${item.changedBy.role})` : ''}
                          </>
                        ) : (
                          <>Changed by <strong className="text-foreground">Staff</strong></>
                        )}
                      </span>

                      <span className="text-muted-foreground">•</span>

                      <span className="text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>

                    {item.note && (
                      <p className="text-xs text-muted-foreground italic bg-muted/30 px-2.5 py-1 rounded border border-border w-fit">
                        Note: {item.note}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No history logged.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
