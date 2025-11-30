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

  // Derive max rank from data (highest score - 1, since highest is "unranked")
  const maxRank = filtered.length > 0 ? Math.max(...filtered.map((g) => g.goldilocks_score)) - 1 : 10;

  // Apply other filters
  filtered = filtered.filter((game) => {
    // Goldilocks filter (score 1 = optimal, scores 2-maxRank = near, maxRank+1 = unranked)
    if (filters.paretoFilter === "pareto-only") {
      if (game.goldilocks_score !== 1) return false;
    } else if (filters.paretoFilter === "pareto-and-near") {
      if (game.goldilocks_score > maxRank) return false;
    }

    // Complexity range
    if (
      game.complexity < filters.complexityRange[0] ||
      game.complexity > filters.complexityRange[1]
    ) {
      return false;
    }

    // Rating range
    if (
      game.bayesaverage < filters.ratingRange[0] ||
      game.bayesaverage > filters.ratingRange[1]
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
      if (filters.sortBy === "pareto") {
        // Sort by Goldilocks Score first (lower score = better), then by rating to break ties
        // "desc" means best first: score 1 before score 2, higher rating before lower
        if (a.goldilocks_score !== b.goldilocks_score) {
          // Lower score is better, so ascending order puts score 1 first
          return filters.sortOrder === "desc"
            ? a.goldilocks_score - b.goldilocks_score
            : b.goldilocks_score - a.goldilocks_score;
        }
        // Break ties with rating (higher is better)
        return filters.sortOrder === "desc"
          ? b.bayesaverage - a.bayesaverage
          : a.bayesaverage - b.bayesaverage;
      }

      const aVal = a[filters.sortBy];
      const bVal = b[filters.sortBy];
      return filters.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }

  return filtered;
}
