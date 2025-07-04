"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "Enero", sales: 1860 },
  { month: "Febrero", sales: 3050 },
  { month: "Marzo", sales: 2370 },
  { month: "Abril", sales: 730 },
  { month: "Mayo", sales: 2090 },
  { month: "Junio", sales: 2140 },
  { month: "Julio", sales: 2860 },
  { month: "Agosto", sales: 3250 },
  { month: "Septiembre", sales: 2570 },
  { month: "Octubre", sales: 1730 },
  { month: "Noviembre", sales: 2890 },
  { month: "Diciembre", sales: 3140 },
]

const chartConfig = {
  sales: {
    label: "Ventas",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function SalesChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
