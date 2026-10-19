"use client";

import { useFormatter } from "next-intl";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** One bar: a label and a count. */
export interface BarDatum {
  readonly label: string;
  readonly count: number;
}

const axis = { fill: "var(--ink-3)", fontSize: 12 };

/** Vertical bars with a hover tooltip (one series, so no legend). */
export function ColumnChart({
  data,
  name,
  dates = false,
  height = 220,
}: {
  data: readonly BarDatum[];
  name: string;
  dates?: boolean;
  height?: number;
}) {
  const format = useFormatter();
  const label = (v: string) =>
    dates ? format.dateTime(new Date(v), { month: "short", day: "numeric" }) : v;
  return (
    <div dir="ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[...data]}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          barCategoryGap={2}
        >
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 4" />
          <XAxis
            dataKey="label"
            tickFormatter={label}
            tick={axis}
            tickLine={false}
            axisLine={{ stroke: "var(--line-strong)" }}
            minTickGap={12}
          />
          <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            cursor={{ fill: "color-mix(in oklab, var(--chart) 10%, transparent)" }}
            labelFormatter={(v: unknown) => label(typeof v === "string" ? v : "")}
            formatter={(v) => [String(v), name]}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              color: "var(--ink)",
              fontSize: 13,
            }}
          />
          <Bar
            dataKey="count"
            name={name}
            fill="var(--chart)"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
