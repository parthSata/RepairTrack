'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LoaderCircle, LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function logout() {
    setIsPending(true)
    await authClient.signOut()
    router.push('/login')
    router.refresh()
  }

  return <Button type="button" variant="outline" disabled={isPending} onClick={logout} className="gap-2">{isPending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <LogOut aria-hidden="true" className="h-4 w-4" />}{isPending ? 'Signing out...' : 'Sign out'}</Button>
}