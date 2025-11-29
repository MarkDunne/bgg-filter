import Fuse from "fuse.js";
import { Game, Filters } from "@/types/game";

export function filterGames(games: Game[], filters: Filters): Game[] {
  let filtered = games;

  // Fuzzy search by name
  if (filters.search.trim()) {
    const fuse = new Fuse(filtered, {
      keys: ["name"],
      threshold: 0.4,
      ignoreLocation: true,
    });
    filtered = fuse.search(filters.search).map((result) => result.item);
  }

  // Apply other filters
  filtered = filtered.filter((game) => {
    // Pareto filter
    if (filters.paretoFilter === "pareto-only") {
      if (!game.is_pareto) return false;
    } else if (filters.paretoFilter === "pareto-and-near") {
      if (!game.is_pareto && !game.almost_pareto) return false;
    }

    // Complexity range
    if (
      game.complexity < filters.complexityRange[0] ||
      game.complexity > filters.complexityRange[1]
    ) {
      return false;
    }

    // Player count
    if (filters.playerCount !== null) {
      if (!game.recommendedwith.includes(filters.playerCount)) {
        return false;
      }
    }

    return true;
  });

  // Sort (skip if searching - keep relevance order)
  if (!filters.search.trim()) {
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy];
      const bVal = b[filters.sortBy];
      return filters.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }

  return filtered;
}
