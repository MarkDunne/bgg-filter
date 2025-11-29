export interface Game {
  id: number;
  name: string;
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
  is_pareto: boolean;
  almost_pareto: boolean;
}

export type ParetoFilter = "all" | "pareto-and-near" | "pareto-only";

export interface Filters {
  search: string;
  paretoFilter: ParetoFilter;
  complexityRange: [number, number];
  playerCount: number | null;
  sortBy: "bayesaverage" | "complexity";
  sortOrder: "asc" | "desc";
}
