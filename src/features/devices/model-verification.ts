export type ModelVerificationResult = {
  brand: string
  model: string | null
  modelVerified: boolean
  modelVerificationOverridden: boolean
  modelVerificationNote: string | null
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

  if (isOverride) {
    const brand = data.brand?.trim() || existing.brand
    const model =
      data.model !== undefined ? data.model?.trim() || null : existing.model

    return {
      brand,
      model,
      modelVerified: true,
      modelVerificationOverridden: true,
      modelVerificationNote: overrideReason,
    }
  }

  const brand = data.brand!.trim()
  const model = data.model!.trim()

  return {
    brand,
    model,
    modelVerified: true,
    modelVerificationOverridden: false,
    modelVerificationNote: null,
  }
}
