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
          <div className="mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Find Me a Boardgame
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Discover the perfect board game for your group
            </p>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Find the best board games by complexity and rating. Filter by player count, categories, and mechanics to find your ideal game.
          </p>
          <section className="mt-3 space-y-2" aria-label="About Goldilocks Score">
            <p className="text-xs sm:text-sm text-muted-foreground">
              <strong className="text-foreground">The Goldilocks Score</strong> helps you find the perfect balance between game quality and complexity.
              A score of 1 means you won't find a better-rated game at that complexity level.
              Score 2 is the next best option, and so on. This pareto-optimal analysis ensures you get maximum enjoyment without overwhelming rules.
            </p>
          </section>
        </header>

        <main className="space-y-3 sm:space-y-4" role="main">
          <section aria-label="Game Filters">
            <FilterControls filters={filters} onChange={setFilters} games={games} gameCount={filteredGames.length} totalCount={games.length} />
          </section>

          <section aria-label="Game Results" className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <article aria-label="Game List">
              <GameTable games={filteredGames} highlightedGame={highlightedGame} mobileSelectedGame={mobileSelectedGame} onHover={handleHover} onMobileClick={handleMobileClick} highlightedRef={rowRefs} />
            </article>
            <aside className="space-y-3 sm:space-y-4" aria-label="Game Visualization">
              <ScatterPlot games={filteredGames} highlightedGame={highlightedGame} onHover={handleHover} onClick={handleScatterClick} />
              <div className="hidden sm:block">
                <GameDetailCard game={selectedGameData} />
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
