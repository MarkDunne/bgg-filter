"use client";

import { Game } from "@/types/game";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

interface ScatterPlotProps {
  games: Game[];
  highlightedGame: number | null;
  onHover: (id: number | null) => void;
  onClick: (id: number) => void;
}

export function ScatterPlot({
  games,
  highlightedGame,
  onHover,
  onClick,
}: ScatterPlotProps) {
  const data = games.map((g) => {
    let label = "Non-Pareto";
    if (g.almost_pareto) label = "Near Pareto";
    if (g.is_pareto) label = "Pareto";
    return {
      id: g.id,
      name: g.name,
      complexity: g.complexity,
      rating: g.bayesaverage,
      label,
    };
  });

  const COLORS: Record<string, string> = {
    "Pareto": "oklch(0.65 0.2 350)",      // Vibrant pink
    "Near Pareto": "oklch(0.7 0.15 160)", // Teal
    "Non-Pareto": "oklch(0.75 0.1 250)",  // Soft purple
  };

  // Calculate dynamic domains with padding
  const ratings = data.map((d) => d.rating);
  const complexities = data.map((d) => d.complexity);
  const ratingPadding = 0.1;
  const complexityPadding = 0.2;
  const ratingDomain: [number, number] = data.length > 0
    ? [
        Math.floor((Math.min(...ratings) - ratingPadding) * 10) / 10,
        Math.ceil((Math.max(...ratings) + ratingPadding) * 10) / 10,
      ]
    : [6, 9];
  const complexityDomain: [number, number] = data.length > 0
    ? [
        Math.max(1, Math.floor((Math.min(...complexities) - complexityPadding) * 10) / 10),
        Math.min(5, Math.ceil((Math.max(...complexities) + complexityPadding) * 10) / 10),
      ]
    : [1, 5];

  return (
    <div className="w-full h-[350px] min-h-[350px] bg-card rounded-lg border p-4">
      <div className="flex justify-end gap-4 mb-2 text-xs">
        {Object.entries(COLORS).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height="90%" minWidth={300} minHeight={250}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
          />
          <XAxis
            dataKey="rating"
            type="number"
            domain={ratingDomain}
            name="Rating"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            label={{
              value: "Rating →",
              position: "bottom",
              offset: 0,
              fontSize: 12,
              fill: "hsl(var(--muted-foreground))",
            }}
          />
          <YAxis
            dataKey="complexity"
            type="number"
            domain={complexityDomain}
            name="Complexity"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            label={{
              value: "Complexity →",
              angle: -90,
              position: "insideLeft",
              fontSize: 12,
              fill: "hsl(var(--muted-foreground))",
            }}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-popover border rounded-md px-3 py-2 shadow-md">
                  <p className="font-medium text-sm">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Rating: {d.rating.toFixed(2)} · Complexity: {d.complexity.toFixed(1)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: COLORS[d.label] }}>
                    {d.label}
                  </p>
                </div>
              );
            }}
          />
          <Scatter
            data={data}
            onMouseEnter={(e) => onHover(e.id)}
            onMouseLeave={() => onHover(null)}
            onClick={(e) => onClick(e.id)}
            cursor="pointer"
          >
            {data.map((entry) => {
              const isHighlighted = entry.id === highlightedGame;
              const isPareto = entry.label === "Pareto";

              return (
                <Cell
                  key={entry.id}
                  fill={COLORS[entry.label]}
                  opacity={isHighlighted ? 1 : 0.8}
                  r={isHighlighted ? 8 : isPareto ? 6 : 4}
                />
              );
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
