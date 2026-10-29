export type ModelVerificationResult = {
  brand: string
  model: string | null
  modelVerified: boolean
  modelVerificationOverridden: boolean
  modelVerificationNote: string | null
}

export type ModelVerificationBadgeKind =
  | 'verified'
  | 'blank'
  | 'lowConfidence'
  | 'override'

/** True when the device has a model name and has been verified (or overridden with a model). */
export function isDeviceModelIdentified(device: {
  model: string | null | undefined
  modelVerified: boolean
}): boolean {
  return device.modelVerified && Boolean(device.model?.trim())
}

/** Badge kind for list/detail/repair surfaces (blank model vs low-confidence guess). */
export function getModelVerificationBadgeKind(device: {
  model: string | null | undefined
  modelVerified: boolean
  modelVerificationOverridden?: boolean
}): ModelVerificationBadgeKind {
  if (device.modelVerificationOverridden) return 'override'
  const hasModel = Boolean(device.model?.trim())
  if (!hasModel) return 'blank'
  if (!device.modelVerified) return 'lowConfidence'
  return 'verified'
}

type DeviceModelVerificationInput = {
  model: string | null | undefined
  markUnverified?: boolean
  overrideReason?: string | null
}

/**
 * Resolves model + verification flags for device create/update.
 * Override is a note only — a model name is still required to be identified.
 */
export function resolveDeviceModelVerification({
  model,
  markUnverified = false,
  overrideReason,
}: DeviceModelVerificationInput): Pick<
  ModelVerificationResult,
  'model' | 'modelVerified' | 'modelVerificationOverridden' | 'modelVerificationNote'
> {
  const modelVal = model?.trim() || null
  const note = overrideReason?.trim() || null

  if (note) {
    return {
      model: modelVal,
      modelVerified: Boolean(modelVal),
      modelVerificationOverridden: true,
      modelVerificationNote: note,
    }
  }

  return {
    model: modelVal,
    modelVerified: Boolean(modelVal) && !markUnverified,
    modelVerificationOverridden: false,
    modelVerificationNote: null,
  }
}

type ExistingDeviceModel = {
  brand: string
  model: string | null
}

type ConfirmModelPayload = {
  brand?: string
  model?: string | null
  modelVerificationOverrideReason?: string | null
}

/**
 * Resolves brand/model + verification flags for repair confirm-model
 * (confirm vs override), matching updateDevice override/confirm semantics.
 */
export function applyConfirmModelVerification({
  existing,
  data,
}: {
  existing: ExistingDeviceModel
  data: ConfirmModelPayload
}): ModelVerificationResult {
  const overrideReason = data.modelVerificationOverrideReason?.trim() || null
  const brand = (data.brand?.trim() || existing.brand).trim()
  const model =
    data.model !== undefined ? data.model?.trim() || null : existing.model

  const verification = resolveDeviceModelVerification({
    model,
    overrideReason,
  })

  if (overrideReason) {
    return { brand, ...verification }
  }

  return {
    brand: data.brand!.trim(),
    model: data.model!.trim(),
    modelVerified: true,
    modelVerificationOverridden: false,
    modelVerificationNote: null,
  }
}
