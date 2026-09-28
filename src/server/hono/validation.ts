import type { Context } from 'hono'
import { jsonError } from '@/server/hono/error-handler'

type ValidationResult =
  | { success: true }
  | { success: false; error: { issues: ReadonlyArray<{ message: string }> } }

/** Shared `zValidator` hook: 400 with the first issue message in the standard error body. */
export function validationHook(result: ValidationResult, c: Context) {
  if (!result.success) {
    return jsonError(c, 400, result.error.issues[0]?.message ?? 'Validation failed', 'VALIDATION_ERROR')
  }
}
