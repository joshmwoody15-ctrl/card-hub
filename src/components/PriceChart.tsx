import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";

type Point = { date: string; price: number; source?: string };

export function PriceChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No price history yet</div>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(new Date(d), "MMM d")}
            stroke="var(--muted-foreground)"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            stroke="var(--muted-foreground)"
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6 }}
            formatter={(v: number) => [`$${v.toFixed(0)}`, "Sale price"]}
            labelFormatter={(d) => format(new Date(d as string), "MMM d, yyyy")}
          />
          <Line type="monotone" dataKey="price" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--gold)" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
