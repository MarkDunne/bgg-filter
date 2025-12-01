"use client";

import { useMemo, useState, useEffect } from "react";
import { Game, Filters, ParetoFilter } from "@/types/game";
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
import { MultiSelect } from "@/components/ui/multi-select";
import { Search } from "lucide-react";
import posthog from "posthog-js";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface FilterControlsProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  games: Game[];
  gameCount: number;
  totalCount: number;
}

export function FilterControls({
  filters,
  onChange,
  games,
  gameCount,
  totalCount,
}: FilterControlsProps) {
  const [localComplexityRange, setLocalComplexityRange] = useState(filters.complexityRange);
  const [localRatingRange, setLocalRatingRange] = useState(filters.ratingRange);

  const debouncedComplexityRange = useDebounce(localComplexityRange, 300);
  const debouncedRatingRange = useDebounce(localRatingRange, 300);

  // Sync local state with filters prop when filters change externally
  useEffect(() => {
    setLocalComplexityRange(filters.complexityRange);
  }, [filters.complexityRange]);

  useEffect(() => {
    setLocalRatingRange(filters.ratingRange);
  }, [filters.ratingRange]);

  // Update filters when debounced values change
  useEffect(() => {
    if (
      debouncedComplexityRange[0] !== filters.complexityRange[0] ||
      debouncedComplexityRange[1] !== filters.complexityRange[1]
    ) {
      onChange({ ...filters, complexityRange: debouncedComplexityRange });
      posthog.capture("filter_applied", {
        filter_type: "complexity",
        min_value: debouncedComplexityRange[0],
        max_value: debouncedComplexityRange[1],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedComplexityRange]);

  useEffect(() => {
    if (
      debouncedRatingRange[0] !== filters.ratingRange[0] ||
      debouncedRatingRange[1] !== filters.ratingRange[1]
    ) {
      onChange({ ...filters, ratingRange: debouncedRatingRange });
      posthog.capture("filter_applied", {
        filter_type: "rating",
        min_value: debouncedRatingRange[0],
        max_value: debouncedRatingRange[1],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedRatingRange]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    games.forEach((g) => g.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [games]);

  const allMechanics = useMemo(() => {
    const mechs = new Set<string>();
    games.forEach((g) => g.mechanics.forEach((m) => mechs.add(m)));
    return Array.from(mechs).sort();
  }, [games]);

  const ratingRange = useMemo(() => {
    if (games.length === 0) return { min: 6, max: 10 };
    const ratings = games.map((g) => g.bayesaverage);
    return {
      min: Math.floor(Math.min(...ratings) * 10) / 10,
      max: Math.ceil(Math.max(...ratings) * 10) / 10,
    };
  }, [games]);

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
          onChange={(e) => {
            const searchValue = e.target.value;
            onChange({ ...filters, search: searchValue });
            if (searchValue.length > 2) {
              posthog.capture("search_performed", {
                search_query: searchValue,
                search_length: searchValue.length,
              });
            }
          }}
          className="pl-8 w-full sm:w-48"
        />
      </div>

      {/* Pareto filter */}
      <div className="flex items-center gap-2">
        <label id="pareto-label" className="text-sm font-medium">Show:</label>
        <Select
          value={filters.paretoFilter}
          onValueChange={(value: ParetoFilter) => {
            onChange({ ...filters, paretoFilter: value });
            posthog.capture("filter_applied", {
              filter_type: "pareto",
              filter_value: value,
            });
          }}
        >
          <SelectTrigger className="w-36" aria-labelledby="pareto-label">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All games</SelectItem>
            <SelectItem value="pareto-and-near">Goldilocks & Near</SelectItem>
            <SelectItem value="pareto-only">Goldilocks only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Complexity slider */}
      <div className="flex items-center gap-3 min-w-[200px] sm:min-w-[240px]">
        <label id="complexity-label" className="text-sm font-medium whitespace-nowrap">Complexity:</label>
        <Slider
          value={localComplexityRange}
          onValueChange={(value) => setLocalComplexityRange(value as [number, number])}
          min={1}
          max={5}
          step={0.1}
          className="w-24 sm:w-32 touch-pan-x"
          aria-labelledby="complexity-label"
          aria-valuetext={`${localComplexityRange[0].toFixed(1)} to ${localComplexityRange[1].toFixed(1)}`}
        />
        <span className="text-sm text-muted-foreground w-16" aria-hidden="true">
          {localComplexityRange[0].toFixed(1)}-{localComplexityRange[1].toFixed(1)}
        </span>
      </div>

      {/* Rating slider */}
      <div className="flex items-center gap-3 min-w-[200px] sm:min-w-[240px]">
        <label id="rating-label" className="text-sm font-medium whitespace-nowrap">Rating:</label>
        <Slider
          value={localRatingRange}
          onValueChange={(value) => setLocalRatingRange(value as [number, number])}
          min={ratingRange.min}
          max={ratingRange.max}
          step={0.1}
          className="w-24 sm:w-32 touch-pan-x"
          aria-labelledby="rating-label"
          aria-valuetext={`${localRatingRange[0].toFixed(1)} to ${localRatingRange[1].toFixed(1)}`}
        />
        <span className="text-sm text-muted-foreground w-16" aria-hidden="true">
          {localRatingRange[0].toFixed(1)}-{localRatingRange[1].toFixed(1)}
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
          onValueChange={(value) => {
            const playerCount = value === "any" ? null : parseInt(value);
            onChange({
              ...filters,
              playerCount,
            });
            posthog.capture("player_count_filtered", {
              player_count: playerCount,
            });
          }}
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

      {/* Categories */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Category:</label>
        <MultiSelect
          options={allCategories}
          selected={filters.categories}
          onChange={(categories) => {
            onChange({ ...filters, categories });
            posthog.capture("category_filter_changed", {
              selected_categories: categories,
              category_count: categories.length,
            });
          }}
          placeholder="Any"
          className="w-32 sm:w-40"
        />
      </div>

      {/* Mechanics */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Mechanic:</label>
        <MultiSelect
          options={allMechanics}
          selected={filters.mechanics}
          onChange={(mechanics) => {
            onChange({ ...filters, mechanics });
            posthog.capture("mechanic_filter_changed", {
              selected_mechanics: mechanics,
              mechanic_count: mechanics.length,
            });
          }}
          placeholder="Any"
          className="w-32 sm:w-40"
        />
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <label id="sort-label" className="text-sm font-medium">Sort:</label>
        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split("-") as [
              "pareto" | "bayesaverage" | "complexity",
              "asc" | "desc"
            ];
            onChange({ ...filters, sortBy, sortOrder });
            posthog.capture("sort_changed", {
              sort_by: sortBy,
              sort_order: sortOrder,
            });
          }}
        >
          <SelectTrigger className="w-44 sm:w-50" aria-labelledby="sort-label">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pareto-desc">Goldilocks Score</SelectItem>
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
