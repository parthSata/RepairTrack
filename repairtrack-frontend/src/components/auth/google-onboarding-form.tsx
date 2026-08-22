'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function GoogleOnboardingForm({ suggestedName }: { suggestedName: string }) {
  const router = useRouter()
  const [shopName, setShopName] = useState(suggestedName)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await apiClient.post('onboarding', { shopName })
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('We could not finish setting up your shop. Please try again.')
      setIsSubmitting(false)
    }
  }

  return <form onSubmit={submit} className="space-y-5" noValidate>
    {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    <div className="space-y-2"><Label htmlFor="shopName">Shop name</Label><Input id="shopName" autoComplete="organization" minLength={2} maxLength={120} value={shopName} onChange={(event) => setShopName(event.target.value)} required /></div>
    <Button type="submit" disabled={isSubmitting} className="w-full gap-2">{isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{isSubmitting ? 'Setting up your shop...' : 'Continue to RepairTrack'}</Button>
  </form>
}