"use client";

import { frenchLabel } from "@/lib/labels";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Single-measure charts: one hue from the design tokens, recessive grid and
// axes in text tokens, so both follow light/dark mode automatically.
const SERIES = "var(--chart-1)";
const GRID = "var(--border)";
const AXIS_TEXT = "var(--muted-foreground)";
const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  boxShadow: "0 10px 24px -6px rgb(15 23 42 / 0.12)",
  fontSize: 13,
};

export function RevenueChart({
  data,
}: {
  data: { month: string; revenue: number }[];
}) {
  return (
    <div
      className="h-72 w-full"
      role="img"
      aria-label={`Revenus encaissés par mois : ${data
        .map((d) => `${d.month} ${d.revenue.toLocaleString("fr-TN")} TND`)
        .join(", ")}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 15, right: 10, left: -12, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={SERIES} stopOpacity={0.2} />
              <stop offset="95%" stopColor={SERIES} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: AXIS_TEXT }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: AXIS_TEXT }}
            tickFormatter={(value: number) =>
              value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
            }
          />
          <Tooltip
            cursor={{ stroke: AXIS_TEXT, strokeDasharray: "4 4" }}
            formatter={(value) => [
              `${Number(value).toLocaleString("fr-TN")} TND`,
              "Revenus",
            ]}
            contentStyle={tooltipStyle}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={SERIES}
            strokeWidth={2}
            fill="url(#revenue)"
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PipelineChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  return (
    <div
      className="h-72 w-full"
      role="img"
      aria-label={`Clients par étape : ${data
        .map((d) => `${frenchLabel(d.status)} ${d.count}`)
        .join(", ")}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 32, left: 8, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            dataKey="status"
            tickFormatter={frenchLabel}
            type="category"
            width={104}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: AXIS_TEXT }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            labelFormatter={(value) => frenchLabel(String(value))}
            formatter={(value) => [value, "Clients"]}
            contentStyle={tooltipStyle}
          />
          <Bar
            dataKey="count"
            name="Clients"
            fill={SERIES}
            radius={[0, 4, 4, 0]}
            barSize={16}
          >
            <LabelList
              dataKey="count"
              position="right"
              fontSize={12}
              fill={AXIS_TEXT}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
