"use client";

import { frenchLabel } from "@/lib/labels";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function RevenueChart({
  data,
}: {
  data: { month: string; revenue: number }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 15, right: 10, left: -18, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
          />
          <Tooltip
            formatter={(value) => [
              `${Number(value).toLocaleString("fr-TN")} TND`,
              "Revenus",
            ]}
            contentStyle={{
              borderRadius: 10,
              borderColor: "#e2e8f0",
              boxShadow: "0 10px 30px rgba(15,23,42,.08)",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#2563eb"
            strokeWidth={2.5}
            fill="url(#revenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const colors = [
  "#3b82f6",
  "#60a5fa",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
];
export function PipelineChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#e2e8f0"
          />
          <XAxis type="number" hide />
          <YAxis
            dataKey="status"
            tickFormatter={frenchLabel}
            type="category"
            width={96}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#475569" }}
          />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            labelFormatter={(value) => frenchLabel(String(value))}
            formatter={(value) => [value, "Clients"]}
            contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0" }}
          />
          <Bar
            dataKey="count"
            name="Clients"
            radius={[0, 6, 6, 0]}
            barSize={20}
          >
            {data.map((entry, index) => (
              <Cell key={entry.status} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
