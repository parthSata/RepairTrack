import { isDeviceModelIdentified } from '@/features/devices/model-verification'
import { getIssuedInvoice, type Repair } from '@/features/repairs/queries'
import {
  getPricingPanelMode,
  PRICING_MESSAGES,
  type ApprovalStatus,
  type PricingPanelMode,
} from '@/features/repairs/pricing-rules'

const SHOP_MANAGER_ROLES = new Set(['OWNER', 'STAFF'])

export type RepairDetailsAccess = {
  canEditDiagnosisAndNotes: boolean
  canRecordParts: boolean
  canReassignTechnician: boolean
  canShowCustomerTracking: boolean
  canEditExpectedDate: boolean
}

export type RepairDetailsViewModel = {
  approvalStatus: ApprovalStatus | null
  hasIssuedInvoice: boolean
  pricingPanelMode: PricingPanelMode
  deviceSummary: string
  savedPricing: {
    laborCharges: number
    additionalCharges: number
    taxPercent: number
  }
  /** Assigned TECH on DIAGNOSING may open confirm-model dialog. */
  canConfirmModel: boolean
  deviceModelIdentified: boolean
  partsLockedReason: string | null
}

/** Role/assignment checks for actions on Repair Details. */
export function getRepairDetailsAccess(
  userRole: string,
  userId: string | undefined,
  repair: Pick<Repair, 'assignedTechnicianId'>,
): RepairDetailsAccess {
  const isAssignedTechnician = repair.assignedTechnicianId === userId
  const canEditDiagnosisAndNotes = SHOP_MANAGER_ROLES.has(userRole) || isAssignedTechnician
  const canReassignTechnician = SHOP_MANAGER_ROLES.has(userRole)

  return {
    canEditDiagnosisAndNotes,
    canRecordParts: canEditDiagnosisAndNotes,
    canReassignTechnician,
    canShowCustomerTracking: canReassignTechnician,
    canEditExpectedDate: canEditDiagnosisAndNotes,
  }
}

/** Derived display flags for the repair details page (pricing, parts lock, summaries). */
export function getRepairDetailsViewModel(
  repair: Repair,
  userRole: string,
  userId: string | undefined,
  isPricingUnlocked: boolean,
): RepairDetailsViewModel {
  const approvalStatus: ApprovalStatus | null = repair.approval?.status ?? null
  const hasIssuedInvoice = getIssuedInvoice(repair) != null
  const pricingPanelMode = getPricingPanelMode({
    userRole,
    status: repair.status,
    approvalStatus,
    hasEstimate: repair.estimatedTotal != null,
    hasIssuedInvoice,
  })

  const deviceModelIdentified = isDeviceModelIdentified(repair.device)

  const partsLockedReason = !deviceModelIdentified
    ? PRICING_MESSAGES.modelNotIdentified
    : hasIssuedInvoice
      ? PRICING_MESSAGES.invoiceIssued
      : pricingPanelMode === 'finalize' && !isPricingUnlocked
        ? PRICING_MESSAGES.partsLockedUntilUnlock
        : null

  const isAssignedTechnician =
    userRole === 'TECHNICIAN' && repair.assignedTechnicianId === userId

  return {
    approvalStatus,
    hasIssuedInvoice,
    pricingPanelMode,
    deviceSummary: [repair.device.brand, repair.device.model].filter(Boolean).join(' '),
    savedPricing: {
      laborCharges: repair.laborCharges ?? 0,
      additionalCharges: repair.additionalCharges ?? 0,
      taxPercent: repair.taxPercent ?? 0,
    },
    // TECH-only dialog; OWNER/STAFF confirm via Device Details edit.
    canConfirmModel:
      isAssignedTechnician &&
      repair.status === 'DIAGNOSING' &&
      !deviceModelIdentified,
    deviceModelIdentified,
    partsLockedReason,
  }
}
