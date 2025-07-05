"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type ChartData = {
    date: string;
    sales: number;
}

const chartConfig = {
  sales: {
    label: "Ventas",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function SalesChart({ data }: { data: ChartData[] }) {
  
  const formattedData = data.map(item => ({
    ...item,
    // Supabase date is 'YYYY-MM-DD', we need to add 'T00:00:00' to parse it correctly as local time
    date: format(new Date(`${item.date}T00:00:00`), "d MMM", { locale: es }),
  }))

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart 
        accessibilityLayer 
        data={formattedData} 
        margin={{ top: 20, right: 20, bottom: 10, left: -10 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
         <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value) => `$${new Intl.NumberFormat('es-MX', {notation: 'compact'}).format(value)}`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
            indicator="dot" 
            formatter={(value) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value as number)}
            labelClassName="font-bold"
          />}
        />
        <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
