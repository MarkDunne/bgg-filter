export interface Game {
  id: number;
  name: string;
  description: string;
  thumbnail: string;
  yearpublished: number;
  bayesaverage: number;
  average: number;
  usersrated: number;
  link: string;
  complexity: number;
  min_players: number;
  max_players: number;
  playing_time: number;
  categories: string[];
  mechanics: string[];
  types: string[];
  bestwith: number[];
  recommendedwith: number[];
  goldilocks_score: number;
}

export type ParetoFilter = "all" | "pareto-and-near" | "pareto-only";

export interface Filters {
  search: string;
  paretoFilter: ParetoFilter;
  complexityRange: [number, number];
  ratingRange: [number, number];
  playerCount: number | null;
  categories: string[];
  mechanics: string[];
  sortBy: "pareto" | "bayesaverage" | "complexity";
  sortOrder: "asc" | "desc";
}
