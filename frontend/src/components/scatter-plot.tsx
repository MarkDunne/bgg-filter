"use client";

import { useMemo } from "react";
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
  ReferenceArea,
  ReferenceDot,
} from "recharts";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useChartZoom } from "@/hooks/use-chart-zoom";
import posthog from "posthog-js";

interface ScatterPlotProps {
  games: Game[];
  highlightedGame: number | null;
  onHover: (id: number | null) => void;
  onClick: (id: number) => void;
}

function getRankColor(rank: number, maxRank: number): string {
  const clampedRank = Math.min(rank, maxRank);
  const t = maxRank > 1 ? (clampedRank - 1) / (maxRank - 1) : 0;
  const lightness = 0.65 + t * 0.18;
  const chroma = 0.14 - t * 0.11;
  return `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} 30)`;
}

export function ScatterPlot({ games, highlightedGame, onHover, onClick }: ScatterPlotProps) {
  const gameIds = useMemo(() => games.map((g) => g.id).sort().join(","), [games]);

  const maxRank = useMemo(
    () => (games.length > 0 ? Math.max(...games.map((g) => g.goldilocks_score)) - 1 : 10),
    [gameIds] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const data = useMemo(
    () =>
      games.map((g) => ({
        id: g.id,
        name: g.name,
        complexity: g.complexity,
        rating: g.bayesaverage,
        score: g.goldilocks_score,
        color: getRankColor(g.goldilocks_score, maxRank),
      })),
    [gameIds, maxRank] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const naturalBounds = useMemo(() => {
    if (data.length === 0) return { left: 6, right: 9, bottom: 1, top: 5 };
    const ratings = data.map((d) => d.rating);
    const complexities = data.map((d) => d.complexity);
    return {
      left: Math.floor((Math.min(...ratings) - 0.1) * 10) / 10,
      right: Math.ceil((Math.max(...ratings) + 0.1) * 10) / 10,
      bottom: Math.max(1, Math.floor((Math.min(...complexities) - 0.2) * 10) / 10),
      top: Math.min(5, Math.ceil((Math.max(...complexities) + 0.2) * 10) / 10),
    };
  }, [data]);

  const { chartRef, currentBounds, isZoomed, isSelecting, selectionArea, resetZoom, handlers } =
    useChartZoom(naturalBounds);

  const highlighted = highlightedGame ? data.find((d) => d.id === highlightedGame) : null;

  return (
    <div
      className="w-full h-[300px] sm:h-[350px] min-h-[300px] bg-card rounded-lg border p-3 sm:p-4"
      role="img"
      aria-label={`Scatter plot showing ${data.length} games by rating and complexity. ${data.filter((d) => d.score === 1).length} with Goldilocks Score 1 (optimal).`}
    >
      <div className="flex justify-between items-center gap-2 mb-2 text-xs" aria-hidden="true">
        <div className="flex items-center gap-1">
          {isZoomed ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetZoom();
                posthog.capture("chart_zoom_reset");
              }}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset zoom
            </Button>
          ) : (
            <span className="text-muted-foreground">Drag to zoom</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRankColor(1, maxRank) }} />
          <span className="text-muted-foreground">Best rating for complexity</span>
          <span className="text-muted-foreground mx-1">→</span>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRankColor(maxRank, maxRank) }} />
          <span className="text-muted-foreground">More complex for rating</span>
        </div>
      </div>

      <div ref={chartRef} className="outline-none" style={{ userSelect: "none", width: "100%", height: "90%" }} {...handlers}>
        <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={250}>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="rating"
              type="number"
              domain={[currentBounds.left, currentBounds.right]}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              allowDataOverflow
              tickFormatter={(v) => v.toFixed(2)}
              label={{ value: "Rating →", position: "bottom", offset: 0, fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              dataKey="complexity"
              type="number"
              domain={[currentBounds.bottom, currentBounds.top]}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              allowDataOverflow
              tickFormatter={(v) => v.toFixed(2)}
              label={{ value: "Complexity →", angle: -90, position: "insideLeft", fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
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
                    {d.score === 1 && <p className="text-xs mt-1" style={{ color: d.color }}>Goldilocks Score: 1 (Optimal)</p>}
                    {d.score > 1 && <p className="text-xs mt-1 text-muted-foreground">Goldilocks Score: {d.score}</p>}
                  </div>
                );
              }}
            />
            {isSelecting && selectionArea && (
              <ReferenceArea
                x1={selectionArea.x1}
                x2={selectionArea.x2}
                y1={selectionArea.y1}
                y2={selectionArea.y2}
                strokeOpacity={0.3}
                fill="hsl(var(--primary))"
                fillOpacity={0.15}
              />
            )}
            <Scatter data={data} onMouseEnter={(e) => onHover(e.id)} onMouseLeave={() => onHover(null)} onClick={(e) => onClick(e.id)} cursor="pointer" isAnimationActive={false}>
              {data.map((entry) => (
                <Cell key={entry.id} fill={entry.color} opacity={0.8} r={Math.max(3, 7 - entry.score * 0.4)} />
              ))}
            </Scatter>
            {highlighted && (
              <ReferenceDot x={highlighted.rating} y={highlighted.complexity} r={12} fill={getRankColor(1, maxRank)} stroke="hsl(var(--foreground))" strokeWidth={2} />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
