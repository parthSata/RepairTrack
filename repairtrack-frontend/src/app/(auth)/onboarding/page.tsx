import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthFormShell } from '@/components/auth/auth-form-shell'
import { GoogleOnboardingForm } from '@/components/auth/google-onboarding-form'
import { auth } from '@/server/auth'

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')
  if (session.user.shopId) redirect('/dashboard')

  return <AuthFormShell title="Set up your shop" description="One last step before you enter your RepairTrack workspace." footer={null}><GoogleOnboardingForm suggestedName={`${session.user.name}'s shop`} /></AuthFormShell>
}