'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
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

  return <Button type="button" variant="outline" disabled={isPending} onClick={logout}>{isPending ? 'Signing out...' : 'Sign out'}</Button>
}