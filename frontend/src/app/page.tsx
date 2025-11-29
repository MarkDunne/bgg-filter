"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { Game, Filters } from "@/types/game";
import { filterGames } from "@/lib/filter-games";
import { FilterControls } from "@/components/filter-controls";
import { ScatterPlot } from "@/components/scatter-plot";
import { GameTable } from "@/components/game-table";
import gamesData from "@/data/games.json";

const games = gamesData as Game[];

const defaultFilters: Filters = {
  search: "",
  paretoFilter: "pareto-and-near",
  complexityRange: [1, 5],
  playerCount: null,
  sortBy: "bayesaverage",
  sortOrder: "desc",
};

export default function Home() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [highlightedGame, setHighlightedGame] = useState<number | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  const filteredGames = useMemo(
    () => filterGames(games, filters),
    [filters]
  );

  const handleScatterClick = useCallback((id: number) => {
    const row = rowRefs.current.get(id);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedGame(id);
      setTimeout(() => setHighlightedGame(null), 2000);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-[1600px]">
        <header className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Board Game Explorer
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Find the best games for your complexity preference
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            <span className="font-medium">Pareto optimal</span> games have the highest rating at their complexity level — no other game is both simpler and better rated.
          </p>
        </header>

        <main className="space-y-3 sm:space-y-4">
          <FilterControls
            filters={filters}
            onChange={setFilters}
            gameCount={filteredGames.length}
            totalCount={games.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <GameTable
              games={filteredGames}
              highlightedGame={highlightedGame}
              onHover={setHighlightedGame}
              highlightedRef={rowRefs}
            />
            <ScatterPlot
              games={filteredGames}
              highlightedGame={highlightedGame}
              onHover={setHighlightedGame}
              onClick={handleScatterClick}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
