import { AuthFormShell } from '@/components/auth/auth-form-shell'
import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <AuthFormShell title="Create your shop" description="Start with a new RepairTrack workspace for your team." footer={null}>
      <RegisterForm />
    </AuthFormShell>
  )
}