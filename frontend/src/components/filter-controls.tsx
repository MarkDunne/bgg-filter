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
    <div className="flex flex-wrap items-center gap-6 p-4 bg-card rounded-lg border">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search games..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-8 w-48"
        />
      </div>

      {/* Pareto filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Show:</span>
        <Select
          value={filters.paretoFilter}
          onValueChange={(value: ParetoFilter) =>
            onChange({ ...filters, paretoFilter: value })
          }
        >
          <SelectTrigger className="w-36">
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
      <div className="flex items-center gap-3 min-w-[240px]">
        <span className="text-sm font-medium whitespace-nowrap">Complexity:</span>
        <Slider
          value={filters.complexityRange}
          onValueChange={(value) =>
            onChange({ ...filters, complexityRange: value as [number, number] })
          }
          min={1}
          max={5}
          step={0.1}
          className="w-32"
        />
        <span className="text-sm text-muted-foreground w-16">
          {filters.complexityRange[0].toFixed(1)}-{filters.complexityRange[1].toFixed(1)}
        </span>
      </div>

      {/* Player count */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Recommended for:</span>
        <Select
          value={filters.playerCount?.toString() ?? "any"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              playerCount: value === "any" ? null : parseInt(value),
            })
          }
        >
          <SelectTrigger className="w-28">
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
        <span className="text-sm font-medium">Sort:</span>
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
          <SelectTrigger className="w-50">
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

      {/* Count badge */}
      <Badge variant="secondary" className="ml-auto">
        {gameCount} of {totalCount} games
      </Badge>
    </div>
  );
}
