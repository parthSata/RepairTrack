import { HardDrive } from 'lucide-react'
import {
  ConditionBadge,
  DeviceTypeIcon,
  ModelVerificationBadge,
} from '@/components/devices/device-table'
import type { Repair } from '@/features/repairs/queries'

type Props = {
  device: Repair['device']
}

export function RepairLinkedDeviceCard({ device }: Props) {
  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-4 transition-colors duration-200 hover:bg-muted/20">
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <HardDrive className="h-3.5 w-3.5" />
        Linked device
      </span>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
          <DeviceTypeIcon type={device.deviceType} />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-foreground">
            <span>{device.brand}</span>
            {device.model ? (
              <span>{device.model}</span>
            ) : (
              <span className="text-xs font-normal italic text-muted-foreground">Unconfirmed</span>
            )}
            <ModelVerificationBadge
              modelVerified={device.modelVerified}
              modelVerificationOverridden={device.modelVerificationOverridden}
            />
          </span>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="capitalize">{device.deviceType.toLowerCase()}</span>
            <ConditionBadge condition={device.condition} />
          </div>
          {device.serialNumber ? (
            <span className="mt-0.5 break-all font-mono text-[11px] text-muted-foreground">
              S/N: {device.serialNumber}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
