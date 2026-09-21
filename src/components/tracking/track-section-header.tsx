import type { LucideIcon } from 'lucide-react'

type TrackSectionHeaderProps = {
  icon: LucideIcon
  title: string
  id?: string
}

export function TrackSectionHeader({ icon: Icon, title, id }: TrackSectionHeaderProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
      <h3
        id={id}
        className="min-w-0 text-sm font-bold uppercase tracking-[0.12em] text-foreground sm:tracking-[0.14em]"
      >
        {title}
      </h3>
    </div>
  )
}
