import type { ReactNode } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export function AuthFormShell({
  title,
  description,
  footer,
  children,
}: {
  title: string
  description: string
  footer: ReactNode
  children: ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <Link href="/login" className="mb-8 block text-center text-xl font-semibold tracking-tight">
          RepairTrack
        </Link>
        <Card className="shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-7 space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            {children}
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </main>
  )
}