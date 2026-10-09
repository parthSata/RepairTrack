'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatRupees } from '@/lib/format-money'

const chartConfig = {
  amount: {
    label: 'Revenue',
    color: 'var(--accent)',
  },
} satisfies ChartConfig

export interface RevenuePointInput {
  label?: string
  month?: string
  amount: number
}

interface MonthlyRevenueChartProps {
  data: RevenuePointInput[]
  subtext?: string
}

export function MonthlyRevenueChart({
  data,
  subtext = 'Collected payments, incl. GST',
}: MonthlyRevenueChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      label: item.label ?? item.month ?? '',
      amount: item.amount,
    }))
  }, [data])

  const tickInterval = useMemo(() => {
    if (chartData.length > 25) return 4
    if (chartData.length > 15) return 2
    return 0
  }, [chartData.length])

  return (
    <div className="flex flex-col space-y-3">
      <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
        <BarChart
          data={chartData}
          margin={{ top: 12, right: 6, left: 6, bottom: 0 }}
          accessibilityLayer
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={tickInterval}
            className="text-[11px] font-medium"
          />
          <ChartTooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
            content={
              <ChartTooltipContent
                hideIndicator
                formatter={(value, name, item) => (
                  <div className="flex flex-col gap-1 min-w-32">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {item?.payload?.label}
                    </span>
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatRupees(Number(value))}
                      </span>
                    </div>
                  </div>
                )}
              />
            }
          />
          <Bar
            dataKey="amount"
            fill="var(--color-amount, var(--accent))"
            radius={[4, 4, 0, 0]}
            maxBarSize={chartData.length > 20 ? 16 : 36}
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
