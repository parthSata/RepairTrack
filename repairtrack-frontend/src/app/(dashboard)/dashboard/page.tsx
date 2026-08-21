import { ArrowUpRight, CheckCircle2, ClipboardList, Clock3, PackageOpen, Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const metrics = [
  { label: 'Active repairs', value: '0', note: 'No open tickets yet', icon: Wrench, tone: 'text-steel' },
  { label: 'Ready for pickup', value: '0', note: 'Nothing waiting today', icon: CheckCircle2, tone: 'text-success' },
  { label: 'Awaiting approval', value: '0', note: 'All estimates are clear', icon: Clock3, tone: 'text-warning' },
  { label: 'Parts to source', value: '0', note: 'Inventory is up to date', icon: PackageOpen, tone: 'text-accent' },
]

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-4 border-b border-border pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Today at a glance</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Keep the bench moving.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Your repair workspace is ready. Start with a ticket, then keep every handoff visible.</p>
        </div>
        <button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90">Create repair <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></button>
      </section>
      <section aria-label="Repair metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, note, icon: Icon, tone }) => <Card key={label} className="border-border shadow-none"><CardContent className="p-5"><div className="flex items-start justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className={`h-5 w-5 ${tone}`} /></div><p className="mt-6 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></CardContent></Card>)}
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card className="border-border shadow-none"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-steel">Work queue</p><h2 className="mt-2 text-lg font-semibold">Recent repairs</h2></div><ClipboardList className="h-5 w-5 text-muted-foreground" /></div><div className="flex min-h-52 flex-col items-center justify-center text-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-steel"><ClipboardList className="h-5 w-5" /></div><p className="mt-4 text-sm font-medium">No repairs yet</p><p className="mt-1 max-w-xs text-sm leading-5 text-muted-foreground">Create your first repair ticket to start tracking the work queue.</p></div></CardContent></Card>
        <Card className="border-border shadow-none"><CardContent className="p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-steel">Flow health</p><h2 className="mt-2 text-lg font-semibold">Repair status</h2><div className="mt-8 flex min-h-36 flex-col items-center justify-center text-center"><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-border" />Received <span className="h-px w-4 bg-border" /><span className="h-2 w-2 rounded-full bg-border" />In repair <span className="h-px w-4 bg-border" /><span className="h-2 w-2 rounded-full bg-border" />Complete</div><p className="mt-5 text-sm text-muted-foreground">Status insights will appear after your first ticket.</p></div></CardContent></Card>
      </section>
    </div>
  )
}
