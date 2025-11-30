"use client";

import { useState, useMemo } from "react";
import { Game, Filters } from "@/types/game";
import { filterGames } from "@/lib/filter-games";
import { FilterControls } from "@/components/filter-controls";
import { ScatterPlot } from "@/components/scatter-plot";
import { GameTable } from "@/components/game-table";
import { GameDetailCard } from "@/components/game-detail-card";
import { useGameSelection } from "@/hooks/use-game-selection";
import gamesData from "@/data/games.json";

// Temporary: Map pareto_rank to goldilocks_score until data is regenerated
const games = (gamesData as any[]).map((game) => ({
  ...game,
  goldilocks_score: game.goldilocks_score ?? game.pareto_rank ?? 999,
})) as Game[];

// Calculate default rating range from data
const getDefaultRatingRange = (): [number, number] => {
  if (games.length === 0) return [6, 10];
  const ratings = games.map((g) => g.bayesaverage);
  const min = Math.floor(Math.min(...ratings) * 10) / 10;
  const max = Math.ceil(Math.max(...ratings) * 10) / 10;
  return [min, max];
};

const defaultFilters: Filters = {
  search: "",
  paretoFilter: "pareto-and-near",
  complexityRange: [1, 5],
  ratingRange: getDefaultRatingRange(),
  playerCount: null,
  categories: [],
  mechanics: [],
  sortBy: "pareto",
  sortOrder: "desc",
};

export default function Home() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const { highlightedGame, selectedGame, mobileSelectedGame, rowRefs, handleHover, handleMobileClick, handleScatterClick } = useGameSelection();

  const filteredGames = useMemo(() => filterGames(games, filters), [filters]);
  const selectedGameData = useMemo(
    () => filteredGames.find((g) => g.id === selectedGame) ?? null,
    [filteredGames, selectedGame]
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-[1600px] w-full overflow-x-hidden">
        <header className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Board Game Explorer</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Find the best games for your complexity preference</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            The Goldilocks score represents the trade off between rating and complexity, letting you find that sweet spot of having a great time and not too many rules. A score of 1 is the best, you won't find a better rated game at that complexity, and a score of 2 is the next best, etc.
          </p>
        </header>

        <main className="space-y-3 sm:space-y-4">
          <FilterControls filters={filters} onChange={setFilters} games={games} gameCount={filteredGames.length} totalCount={games.length} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <GameTable games={filteredGames} highlightedGame={highlightedGame} mobileSelectedGame={mobileSelectedGame} onHover={handleHover} onMobileClick={handleMobileClick} highlightedRef={rowRefs} />
            <div className="space-y-3 sm:space-y-4">
              <ScatterPlot games={filteredGames} highlightedGame={highlightedGame} onHover={handleHover} onClick={handleScatterClick} />
              <div className="hidden sm:block">
                <GameDetailCard game={selectedGameData} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
