'use client'

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatRupees } from '@/lib/format-money'
import type { MonthlyRevenuePoint } from '@/features/dashboard/schemas'

const chartConfig = {
  amount: {
    label: 'Revenue',
    color: 'var(--accent)',
  },
} satisfies ChartConfig

interface MonthlyRevenueChartProps {
  data: MonthlyRevenuePoint[]
  subtext?: string
}

export function MonthlyRevenueChart({
  data,
  subtext = 'Collected payments, incl. GST',
}: MonthlyRevenueChartProps) {
  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      <ChartContainer config={chartConfig} className="h-52 w-full">
        <BarChart
          data={data}
          margin={{ top: 12, right: 6, left: 6, bottom: 0 }}
          accessibilityLayer
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-[11px] font-medium"
          />
          <ChartTooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
            content={
              <ChartTooltipContent
                hideIndicator
                formatter={(value) => (
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatRupees(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar
            dataKey="amount"
            fill="var(--color-amount, var(--accent))"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ChartContainer>

      {subtext && (
        <p className="text-xs text-muted-foreground border-t border-border/60 pt-2.5">
          {subtext}
        </p>
      )}
    </div>
  )
}
