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

  // Derive max rank from data (highest rank - 1, since highest is "unranked")
  const maxRank = filtered.length > 0 ? Math.max(...filtered.map((g) => g.pareto_rank)) - 1 : 10;

  // Apply other filters
  filtered = filtered.filter((game) => {
    // Pareto filter (rank 1 = optimal, ranks 2-maxRank = near, maxRank+1 = unranked)
    if (filters.paretoFilter === "pareto-only") {
      if (game.pareto_rank !== 1) return false;
    } else if (filters.paretoFilter === "pareto-and-near") {
      if (game.pareto_rank > maxRank) return false;
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

    // Categories (OR logic - match any selected)
    if (filters.categories.length > 0) {
      if (!filters.categories.some((cat) => game.categories.includes(cat))) {
        return false;
      }
    }

    // Mechanics (OR logic - match any selected)
    if (filters.mechanics.length > 0) {
      if (!filters.mechanics.some((mech) => game.mechanics.includes(mech))) {
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
