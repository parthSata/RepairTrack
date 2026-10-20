import { FileText, Wrench } from 'lucide-react'

type Props = {
  problemDescription: string | null
  issueDescription: string | null
  initialCondition: string | null
}

export function RepairIssueConditionGrid({
  problemDescription,
  issueDescription,
  initialCondition,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="space-y-2 rounded-xl border border-border/70 bg-muted/15 p-4 md:col-span-1">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <Wrench className="h-3.5 w-3.5 text-accent" />
          Problem description
        </span>
        <p className="text-sm leading-relaxed text-foreground">
          {problemDescription || issueDescription || 'No description provided.'}
        </p>
      </div>

      <div className="space-y-2 rounded-xl border border-border/70 bg-muted/15 p-4">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <FileText className="h-3.5 w-3.5 text-steel" />
          Initial condition & accessories
        </span>
        <p className="text-sm leading-relaxed text-foreground">
          {initialCondition || 'No condition notes recorded.'}
        </p>
      </div>
    </div>
  )
}
