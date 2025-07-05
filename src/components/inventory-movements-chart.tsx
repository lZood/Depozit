
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
    units_in: number;
    units_out: number;
}

const chartConfig = {
  units_in: {
    label: "Entradas",
    color: "hsl(var(--chart-2))",
  },
  units_out: {
    label: "Salidas",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function InventoryMovementsChart({ data }: { data: ChartData[] }) {

  const formattedData = data.map(item => ({
    ...item,
    // Supabase date is 'YYYY-MM-DD', we need to add 'T00:00:00' to parse it correctly as local time
    date: format(new Date(`${item.date}T00:00:00`), "d MMM", { locale: es }),
  }))

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[350px]">
      <BarChart 
        accessibilityLayer 
        data={formattedData} 
        margin={{ top: 20, right: 20, bottom: 10, left: 10 }}
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
          tickFormatter={(value) => new Intl.NumberFormat('es-MX').format(value)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
            indicator="dot" 
          />}
        />
        <Bar dataKey="units_in" fill="var(--color-units_in)" radius={4} />
        <Bar dataKey="units_out" fill="var(--color-units_out)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
