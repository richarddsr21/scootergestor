"use client"

import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface RevenueChartProps {
  data: { date: string; total: number }[]
}

function fmtShort(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    compactDisplay: "short",
    style: "currency",
    currency: "BRL",
  }).format(n)
}

function fmtDateShort(iso: string) {
  const [, m, d] = iso.split("-")
  return `${d}/${m}`
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%" debounce={200}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-teal)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--brand-teal)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDateShort}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: "var(--secondary)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(v) => fmtDateShort(String(v))}
            formatter={(value) => [fmtShort(Number(value)), "Faturamento"]}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--brand-teal)"
            strokeWidth={2}
            fill="url(#revenue-gradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
