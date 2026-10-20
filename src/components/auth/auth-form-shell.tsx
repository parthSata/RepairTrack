import type { ReactNode } from 'react'
import Image from 'next/image'
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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6">
      <div className="page-enter w-full max-w-md">
        <Link href="/login" className="mb-8 flex items-center justify-center gap-3 text-xl font-semibold tracking-tight">
          <Image src="/icon.png" alt="RepairTrack" width={36} height={36} className="h-9 w-9 object-contain" priority />
          RepairTrack
        </Link>
        <Card className="border-border shadow-[0_12px_32px_rgba(24,33,43,0.08)]">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-7 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Repair operations</p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
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