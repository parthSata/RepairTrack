'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  HardDrive,
  FileText,
  MessageSquare,
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
import { StatusHistoryTimeline } from './status-history-timeline'
import { ApprovalEstimateBreakdown } from './approval-estimate-summary'
import { RequestApprovalControl } from './request-approval-control'
import { ApprovalStatusBanner } from './approval-status-badge'
import { TechnicianCombobox } from './technician-combobox'
import { AssignmentOnHoldCard } from './assignment-on-hold-card'
import { getRepairStatusLabel, getRepairStatusTone } from '@/features/repairs/status-ui'
import { cn } from '@/lib/utils'
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
    <div className="page-enter flex w-full min-w-0 flex-col gap-6">
      {/* Top Header Navigation */}
      <header className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/repairs" className="w-fit">
          <Button
            variant="ghost"
            className="h-9 -ml-3 gap-2 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to Repair Tickets
          </Button>
        </Link>
      </header>

      {/* Model Confirmation Card (if unverified device in DIAGNOSING state) */}
      {showModelConfirmationCard && (
        <ModelConfirmationCard device={repair.device} onConfirmed={() => refetch()} />
      )}

      {/* Main Ticket Overview Header Card */}
      <Card className="w-full min-w-0 overflow-hidden border-border/80 shadow-sm">
        <CardContent className="flex w-full min-w-0 flex-col gap-6 pt-6">
          <div className="flex w-full min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div className="flex min-w-0 flex-col gap-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Repair ticket
                </p>
                <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground wrap-break-word sm:text-3xl">
                  #{repair.ticketNumber}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">
                    {repair.priority} priority
                  </Badge>
                  {!repair.approval ? (
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                        getRepairStatusTone(repair.status).chip,
                      )}
                    >
                      {getRepairStatusLabel(repair.status)}
                    </span>
                  ) : null}
                </div>
              </div>

              {repair.approval ? <ApprovalStatusBanner approval={repair.approval} /> : null}

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <User className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span>
                  Created by{' '}
                  <span className="font-medium text-foreground/80">
                    {repair.creator?.name ?? 'Shop User'}
                  </span>
                  {repair.creator?.role && (
                    <span className="ml-1.5 rounded border border-border/80 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                      {repair.creator.role}
                    </span>
                  )}
                  <span className="mx-1.5 text-border">·</span>
                  {formatDateTime(repair.createdAt)}
                </span>
              </div>
            </div>

            {/* Status Control Box */}
            <div className="flex w-full min-w-0 shrink-0 flex-col gap-4 rounded-xl border border-border/80 bg-gradient-to-b from-muted/40 to-muted/10 p-4 shadow-sm transition-shadow duration-200 hover:shadow-md lg:max-w-sm">
              <StatusChangeControl
                repairId={repair.id}
                ticketNumber={repair.ticketNumber}
                currentStatus={repair.status}
                customerName={repair.customer.name}
                deviceSummary={[repair.device.brand, repair.device.model].filter(Boolean).join(' ')}
                assignedTechnicianId={repair.assignedTechnicianId}
                onStatusUpdated={() => refetch()}
              />
              <div className="h-px w-full bg-border/70" />
              <RequestApprovalControl
                repairId={repair.id}
                ticketNumber={repair.ticketNumber}
                customerName={repair.customer.name}
                deviceSummary={[repair.device.brand, repair.device.model].filter(Boolean).join(' ')}
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
          <div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-2">
            {/* Linked Device */}
            <div className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-4 transition-colors duration-200 hover:bg-muted/20">
              <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <HardDrive className="h-3.5 w-3.5" />
                Linked device
              </span>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                  <DeviceTypeIcon type={repair.device.deviceType} />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-foreground">
                    <span>{repair.device.brand}</span>
                    {repair.device.model ? (
                      <span>{repair.device.model}</span>
                    ) : (
                      <span className="text-xs font-normal italic text-muted-foreground">Unconfirmed</span>
                    )}
                    <ModelVerificationBadge
                      modelVerified={repair.device.modelVerified}
                      modelVerificationOverridden={repair.device.modelVerificationOverridden}
                    />
                  </span>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{repair.device.deviceType.toLowerCase()}</span>
                    <ConditionBadge condition={repair.device.condition} />
                  </div>
                  {repair.device.serialNumber && (
                    <span className="mt-0.5 break-all font-mono text-[11px] text-muted-foreground">
                      S/N: {repair.device.serialNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Linked Customer */}
            <div className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-4 transition-colors duration-200 hover:bg-muted/20">
              <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                Customer
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{repair.customer.name}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{repair.customer.phone}</span>
                {repair.customer.email && (
                  <span className="break-all text-xs text-muted-foreground">{repair.customer.email}</span>
                )}
              </div>
            </div>

            {/* Technician Assignment */}
            <div className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-4 transition-colors duration-200 hover:bg-muted/20">
              <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
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

              {canReassignTechnician && repair.currentAssignment?.status !== 'ON_HOLD' ? (
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
                    className="h-9 w-full px-3 text-xs sm:w-auto"
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
            <div className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-4 transition-colors duration-200 hover:bg-muted/20">
              <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
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
                      className="h-9 flex-1 px-2 text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingExpectedDate(false)}
                        className="h-9 flex-1 px-2 text-xs sm:flex-none"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveExpectedDate}
                        disabled={updateExpectedDateMutation.isPending}
                        className="h-9 flex-1 px-2.5 text-xs sm:flex-none"
                      >
                        {updateExpectedDateMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
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
                      className="h-8 w-full gap-1 px-2 text-xs text-muted-foreground hover:text-foreground sm:w-auto"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                )
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-border/70 bg-muted/15 p-4 md:col-span-1">
              <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <Wrench className="h-3.5 w-3.5 text-accent" />
                Problem description
              </span>
              <p className="text-sm leading-relaxed text-foreground">
                {repair.problemDescription || repair.issueDescription || 'No description provided.'}
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-border/70 bg-muted/15 p-4">
              <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <FileText className="h-3.5 w-3.5 text-steel" />
                Initial condition & accessories
              </span>
              <p className="text-sm leading-relaxed text-foreground">
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
      <Card className="overflow-hidden border-border/80 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-steel" aria-hidden />
              </div>
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Technical diagnosis
              </h3>
            </div>

            {canEditDiagnosisAndNotes && !isDiagnosisEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDiagnosisEditing(true)}
                className="h-8 text-xs"
              >
                Edit
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
                className="rounded-xl text-sm"
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
            <p className="rounded-xl border border-border/70 bg-muted/15 p-4 text-sm leading-relaxed text-foreground">
              {repair.diagnosis ? (
                repair.diagnosis
              ) : (
                <span className="italic text-muted-foreground">
                  No technician diagnosis recorded yet.
                </span>
              )}
            </p>
          )}

          <div className="space-y-3 border-t border-border/70 pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-sm font-semibold tracking-tight text-foreground">
                {pendingApprovalBreakdown ? 'Repair estimate' : 'Original estimate'}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">(₹)</span>
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
                  className="h-8 w-full gap-1.5 text-xs sm:w-auto"
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
                  className="w-full max-w-sm text-sm"
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
                    ? 'rounded-xl border border-accent/25 bg-accent/10 px-5 py-5'
                    : undefined
                }
              >
                {repair.estimatedCost !== null ? (
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {formatINRFromPaise(repair.estimatedCost)}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    Not set — enter amount in rupees before requesting approval
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Repair Notes Section (Append-only) */}
      <Card className="overflow-hidden border-border/80 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
        <CardContent className="space-y-5 pt-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <MessageSquare className="h-4 w-4 text-steel" aria-hidden />
            </div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">Repair notes</h3>
          </div>

          {canEditDiagnosisAndNotes && (
            <form onSubmit={handleAddNote} className="space-y-3">
              <Textarea
                placeholder="Add a new repair note..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={2}
                className="rounded-xl text-sm"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={addNoteMutation.isPending || !newNoteText.trim()}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-2.5">
            {repair.notes && repair.notes.length > 0 ? (
              repair.notes.map((note) => (
                <div
                  key={note.id}
                  className="space-y-1.5 rounded-xl border border-border/70 bg-card px-3.5 py-3 transition-colors duration-200 hover:bg-muted/20"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {note.author.name}
                      {note.author.role && (
                        <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {note.author.role}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 tabular-nums">{formatDateTime(note.createdAt)}</span>
                  </div>
                  <p className="pl-5 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {note.note}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-border bg-muted/15 py-6 text-center text-xs italic text-muted-foreground">
                No repair notes recorded.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <StatusHistoryTimeline items={repair.statusHistory} />
    </div>
  )
}
