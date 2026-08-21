import Link from 'next/link'
import { AuthFormShell } from '@/components/auth/auth-form-shell'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <AuthFormShell
      title="Welcome back"
      description="Sign in to keep your repair shop moving."
      footer={<>New to RepairTrack? <Link href="/register" className="font-medium text-foreground hover:underline">Create a shop</Link></>}
    >
      <LoginForm />
    </AuthFormShell>
  )
}