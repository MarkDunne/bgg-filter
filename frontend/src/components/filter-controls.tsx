"use client";

import { Filters, ParetoFilter } from "@/types/game";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface FilterControlsProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  gameCount: number;
  totalCount: number;
}

export function FilterControls({
  filters,
  onChange,
  gameCount,
  totalCount,
}: FilterControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6 p-3 sm:p-4 bg-card rounded-lg border">
      {/* Search */}
      <div className="relative w-full sm:w-auto">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          type="text"
          placeholder="Search games..."
          aria-label="Search games by name"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-8 w-full sm:w-48"
        />
      </div>

      {/* Pareto filter */}
      <div className="flex items-center gap-2">
        <label id="pareto-label" className="text-sm font-medium">Show:</label>
        <Select
          value={filters.paretoFilter}
          onValueChange={(value: ParetoFilter) =>
            onChange({ ...filters, paretoFilter: value })
          }
        >
          <SelectTrigger className="w-36" aria-labelledby="pareto-label">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All games</SelectItem>
            <SelectItem value="pareto-and-near">Pareto & Near</SelectItem>
            <SelectItem value="pareto-only">Pareto only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Complexity slider */}
      <div className="flex items-center gap-3 min-w-[200px] sm:min-w-[240px]">
        <label id="complexity-label" className="text-sm font-medium whitespace-nowrap">Complexity:</label>
        <Slider
          value={filters.complexityRange}
          onValueChange={(value) =>
            onChange({ ...filters, complexityRange: value as [number, number] })
          }
          min={1}
          max={5}
          step={0.1}
          className="w-24 sm:w-32 touch-pan-x"
          aria-labelledby="complexity-label"
          aria-valuetext={`${filters.complexityRange[0].toFixed(1)} to ${filters.complexityRange[1].toFixed(1)}`}
        />
        <span className="text-sm text-muted-foreground w-16" aria-hidden="true">
          {filters.complexityRange[0].toFixed(1)}-{filters.complexityRange[1].toFixed(1)}
        </span>
      </div>

      {/* Player count */}
      <div className="flex items-center gap-2">
        <label id="players-label" className="text-sm font-medium whitespace-nowrap">
          <span className="hidden sm:inline">Recommended for:</span>
          <span className="sm:hidden">Players:</span>
        </label>
        <Select
          value={filters.playerCount?.toString() ?? "any"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              playerCount: value === "any" ? null : parseInt(value),
            })
          }
        >
          <SelectTrigger className="w-28" aria-labelledby="players-label">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <SelectItem key={n} value={n.toString()}>
                {n} {n === 1 ? "player" : "players"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <label id="sort-label" className="text-sm font-medium">Sort:</label>
        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split("-") as [
              "bayesaverage" | "complexity",
              "asc" | "desc"
            ];
            onChange({ ...filters, sortBy, sortOrder });
          }}
        >
          <SelectTrigger className="w-44 sm:w-50" aria-labelledby="sort-label">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bayesaverage-desc">Rating (high→low)</SelectItem>
            <SelectItem value="bayesaverage-asc">Rating (low→high)</SelectItem>
            <SelectItem value="complexity-asc">Complexity (low→high)</SelectItem>
            <SelectItem value="complexity-desc">Complexity (high→low)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Count badge - live region for screen readers */}
      <Badge
        variant="secondary"
        className="ml-auto"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Showing {gameCount} of {totalCount} games
      </Badge>
    </div>
  );
}
