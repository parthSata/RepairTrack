export type ModelVerificationResult = {
  brand: string
  model: string | null
  modelVerified: boolean
  modelVerificationOverridden: boolean
  modelVerificationNote: string | null
}

/** True when the device has a model name and has been verified (or overridden with a model). */
export function isDeviceModelIdentified(device: {
  model: string | null | undefined
  modelVerified: boolean
}): boolean {
  return device.modelVerified && Boolean(device.model?.trim())
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
  const isOverride = Boolean(overrideReason)

  const brand = (data.brand?.trim() || existing.brand).trim()
  const model =
    data.model !== undefined ? data.model?.trim() || null : existing.model

  if (isOverride) {
    return {
      brand,
      model,
      modelVerified: Boolean(model),
      modelVerificationOverridden: true,
      modelVerificationNote: overrideReason,
    }
  }

  return {
    brand: data.brand!.trim(),
    model: data.model!.trim(),
    modelVerified: true,
    modelVerificationOverridden: false,
    modelVerificationNote: null,
  }
}
