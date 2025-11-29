"use client";

import { useState, useMemo, useCallback, useRef } from "react";
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

interface ScatterPlotProps {
  games: Game[];
  highlightedGame: number | null;
  onHover: (id: number | null) => void;
  onClick: (id: number) => void;
}

function getRankColor(rank: number, maxRank: number): string {
  // Gradient from warm coral (rank 1) to pale cream (maxRank+)
  // Using OKLCH: L (lightness), C (chroma/saturation), H (hue ~30 = warm orange/coral)
  const clampedRank = Math.min(rank, maxRank);
  const t = maxRank > 1 ? (clampedRank - 1) / (maxRank - 1) : 0; // 0 for rank 1, 1 for maxRank

  const lightness = 0.65 + t * 0.18; // 0.65 → 0.83
  const chroma = 0.14 - t * 0.11; // 0.14 → 0.03
  const hue = 30; // Warm orange/coral to match the theme

  return `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} ${hue})`;
}

interface ZoomState {
  left: number;
  right: number;
  bottom: number;
  top: number;
}

export function ScatterPlot({
  games,
  highlightedGame,
  onHover,
  onClick,
}: ScatterPlotProps) {
  const [zoom, setZoom] = useState<ZoomState | null>(null);
  const [refAreaLeft, setRefAreaLeft] = useState<number | undefined>();
  const [refAreaRight, setRefAreaRight] = useState<number | undefined>();
  const [refAreaTop, setRefAreaTop] = useState<number | undefined>();
  const [refAreaBottom, setRefAreaBottom] = useState<number | undefined>();
  const chartRef = useRef<HTMLDivElement>(null);

  // Memoize based on game IDs to avoid re-renders on sort changes
  const gameIds = useMemo(() => games.map((g) => g.id).sort().join(","), [games]);

  // Derive max rank from data (highest rank - 1, since highest is "unranked")
  const maxRank = useMemo(() => {
    return games.length > 0 ? Math.max(...games.map((g) => g.pareto_rank)) - 1 : 10;
  }, [gameIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const data = useMemo(
    () =>
      games.map((g) => ({
        id: g.id,
        name: g.name,
        complexity: g.complexity,
        rating: g.bayesaverage,
        rank: g.pareto_rank,
        color: getRankColor(g.pareto_rank, maxRank),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameIds, maxRank]
  );

  // Calculate natural bounds from data
  const naturalBounds = useMemo(() => {
    if (data.length === 0) {
      return { left: 6, right: 9, bottom: 1, top: 5 };
    }
    const ratings = data.map((d) => d.rating);
    const complexities = data.map((d) => d.complexity);
    const ratingPadding = 0.1;
    const complexityPadding = 0.2;
    return {
      left: Math.floor((Math.min(...ratings) - ratingPadding) * 10) / 10,
      right: Math.ceil((Math.max(...ratings) + ratingPadding) * 10) / 10,
      bottom: Math.max(
        1,
        Math.floor((Math.min(...complexities) - complexityPadding) * 10) / 10
      ),
      top: Math.min(
        5,
        Math.ceil((Math.max(...complexities) + complexityPadding) * 10) / 10
      ),
    };
  }, [data]);

  const currentBounds = zoom ?? naturalBounds;
  const isZoomed = zoom !== null;

  // Convert pixel position to data coordinates
  const getDataCoords = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!chartRef.current) return null;

      const rect = chartRef.current.getBoundingClientRect();
      // Chart margins: left: 10, right: 10, top: 10, bottom: 20
      const chartLeft = 40; // approximate left margin with y-axis
      const chartRight = 10;
      const chartTop = 10;
      const chartBottom = 30; // approximate bottom margin with x-axis

      const chartWidth = rect.width - chartLeft - chartRight;
      const chartHeight = rect.height - chartTop - chartBottom;

      const x = e.clientX - rect.left - chartLeft;
      const y = e.clientY - rect.top - chartTop;

      if (x < 0 || x > chartWidth || y < 0 || y > chartHeight) return null;

      const xRatio = x / chartWidth;
      const yRatio = 1 - y / chartHeight; // Invert Y because screen coords are top-down

      const dataX =
        currentBounds.left + xRatio * (currentBounds.right - currentBounds.left);
      const dataY =
        currentBounds.bottom + yRatio * (currentBounds.top - currentBounds.bottom);

      return { x: dataX, y: dataY };
    },
    [currentBounds]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const coords = getDataCoords(e);
      if (coords) {
        setRefAreaLeft(coords.x);
        setRefAreaBottom(coords.y);
        setRefAreaRight(undefined);
        setRefAreaTop(undefined);
      }
    },
    [getDataCoords]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (refAreaLeft !== undefined && refAreaBottom !== undefined) {
        const coords = getDataCoords(e);
        if (coords) {
          setRefAreaRight(coords.x);
          setRefAreaTop(coords.y);
        }
      }
    },
    [refAreaLeft, refAreaBottom, getDataCoords]
  );

  const handleMouseUp = useCallback(() => {
    if (
      refAreaLeft !== undefined &&
      refAreaRight !== undefined &&
      refAreaBottom !== undefined &&
      refAreaTop !== undefined
    ) {
      const x1 = Math.min(refAreaLeft, refAreaRight);
      const x2 = Math.max(refAreaLeft, refAreaRight);
      const y1 = Math.min(refAreaBottom, refAreaTop);
      const y2 = Math.max(refAreaBottom, refAreaTop);

      // Only zoom if selection is meaningful
      if (x2 - x1 > 0.02 && y2 - y1 > 0.05) {
        setZoom({ left: x1, right: x2, bottom: y1, top: y2 });
      }
    }
    setRefAreaLeft(undefined);
    setRefAreaRight(undefined);
    setRefAreaBottom(undefined);
    setRefAreaTop(undefined);
  }, [refAreaLeft, refAreaRight, refAreaBottom, refAreaTop]);

  const resetZoom = () => setZoom(null);

  const isSelecting =
    refAreaLeft !== undefined &&
    refAreaRight !== undefined &&
    refAreaBottom !== undefined &&
    refAreaTop !== undefined;

  return (
    <div
      className="w-full h-[300px] sm:h-[350px] min-h-[300px] bg-card rounded-lg border p-3 sm:p-4"
      role="img"
      aria-label={`Scatter plot showing ${data.length} games plotted by rating (x-axis) and complexity (y-axis). ${data.filter((d) => d.rank === 1).length} Pareto optimal games highlighted.`}
    >
      <div
        className="flex justify-between items-center gap-2 mb-2 text-xs"
        aria-hidden="true"
      >
        <div className="flex items-center gap-1">
          {isZoomed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetZoom}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset zoom
            </Button>
          )}
          {!isZoomed && (
            <span className="text-muted-foreground">Drag to zoom</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getRankColor(1, maxRank) }}
          />
          <span className="text-muted-foreground">Best rating for given complexity</span>
          <span className="text-muted-foreground mx-1">→</span>
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getRankColor(maxRank, maxRank) }}
          />
          <span className="text-muted-foreground">More complex for given rating</span>
        </div>
      </div>
      <div
        ref={chartRef}
        className="outline-none"
        style={{ userSelect: "none", width: "100%", height: "90%" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setRefAreaLeft(undefined);
          setRefAreaRight(undefined);
          setRefAreaBottom(undefined);
          setRefAreaTop(undefined);
        }}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={250}>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="rating"
              type="number"
              domain={[currentBounds.left, currentBounds.right]}
              name="Rating"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              allowDataOverflow
              tickFormatter={(v) => v.toFixed(2)}
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
              domain={[currentBounds.bottom, currentBounds.top]}
              name="Complexity"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              allowDataOverflow
              tickFormatter={(v) => v.toFixed(2)}
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
                      Rating: {d.rating.toFixed(2)} · Complexity:{" "}
                      {d.complexity.toFixed(1)}
                    </p>
                    {d.rank === 1 && (
                      <p className="text-xs mt-1" style={{ color: d.color }}>
                        Pareto optimal
                      </p>
                    )}
                  </div>
                );
              }}
            />
            {isSelecting && (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                y1={refAreaBottom}
                y2={refAreaTop}
                strokeOpacity={0.3}
                fill="hsl(var(--primary))"
                fillOpacity={0.15}
              />
            )}
            <Scatter
              data={data}
              onMouseEnter={(e) => onHover(e.id)}
              onMouseLeave={() => onHover(null)}
              onClick={(e) => onClick(e.id)}
              cursor="pointer"
              isAnimationActive={false}
            >
              {data.map((entry) => {
                // Size based on rank: rank 1 = 6, rank 10 = 3
                const baseSize = Math.max(3, 7 - entry.rank * 0.4);
                return (
                  <Cell
                    key={entry.id}
                    fill={entry.color}
                    opacity={0.8}
                    r={baseSize}
                  />
                );
              })}
            </Scatter>
            {/* Highlighted point rendered on top */}
            {highlightedGame && (() => {
              const highlighted = data.find((d) => d.id === highlightedGame);
              if (!highlighted) return null;
              return (
                <ReferenceDot
                  x={highlighted.rating}
                  y={highlighted.complexity}
                  r={12}
                  fill={getRankColor(1, maxRank)}
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                />
              );
            })()}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
