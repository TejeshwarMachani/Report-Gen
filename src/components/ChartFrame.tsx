import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtCompact } from "@/lib/report";

const AXIS_STYLE = { fontSize: 11, fill: "var(--muted-foreground)" };

type TooltipEntry = { name?: string; value?: number | string };

function TooltipBox({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums text-muted-foreground">
          {p.name}: <span className="font-medium text-foreground">{p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

export function SeriesBarChart({
  data,
  color = "var(--chart-1)",
  horizontal = false,
}: {
  data: { label: string; value: number }[];
  color?: string;
  horizontal?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 4, right: 8, bottom: 0, left: horizontal ? 40 : -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={!horizontal} horizontal={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={AXIS_STYLE} tickFormatter={(v) => fmtCompact(v)} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" tick={AXIS_STYLE} width={120} axisLine={false} tickLine={false} />
          </>
        ) : (
          <>
            <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_STYLE} tickFormatter={(v) => fmtCompact(v)} axisLine={false} tickLine={false} />
          </>
        )}
        <Tooltip content={<TooltipBox />} cursor={{ fill: "var(--accent)" }} />
        <Bar dataKey="value" name="Value" fill={color} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={42} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SeriesLineChart({
  data,
  color = "var(--chart-1)",
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_STYLE} tickFormatter={(v) => fmtCompact(v)} axisLine={false} tickLine={false} />
        <Tooltip content={<TooltipBox />} />
        <Line type="monotone" dataKey="value" name="Value" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "#94a3b8"];

export function SeriesPieChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="var(--card)">
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<TooltipBox />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ForecastChart({
  data,
}: {
  data: { label: string; value: number; kind: "actual" | "forecast"; lower?: number; upper?: number }[];
}) {
  const actual = data.filter((d) => d.kind === "actual").map((d) => ({ label: d.label, value: d.value }));
  const forecast = data
    .filter((d) => d.kind === "forecast")
    .map((d) => ({ label: d.label, value: d.value, lower: d.lower, upper: d.upper }));
  // Anchor line: repeat last actual as first forecast point for a connected look
  const lastActual = actual[actual.length - 1];
  const forecastWithAnchor = lastActual ? [{ label: lastActual.label, value: lastActual.value }, ...forecast] : forecast;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDuplicatedCategory={false} type="category" />
        <YAxis tick={AXIS_STYLE} tickFormatter={(v) => fmtCompact(v)} axisLine={false} tickLine={false} />
        <Tooltip content={<TooltipBox />} />
        <Line data={actual} dataKey="value" name="Actual" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3, fill: "var(--chart-1)" }} />
        <Line data={forecastWithAnchor} dataKey="value" name="Forecast" stroke="var(--chart-4)" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3, fill: "var(--chart-4)" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
