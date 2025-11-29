"use client";

import { Game } from "@/types/game";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface GameTableProps {
  games: Game[];
  highlightedGame: number | null;
  onHover: (id: number | null) => void;
  highlightedRef: React.RefObject<Map<number, HTMLTableRowElement>>;
}

export function GameTable({
  games,
  highlightedGame,
  onHover,
  highlightedRef,
}: GameTableProps) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="max-h-[600px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="min-w-[300px]">Name</TableHead>
              <TableHead className="w-[80px] text-right">Rating</TableHead>
              <TableHead className="w-[90px] text-right">Complexity</TableHead>
              <TableHead className="w-[130px]">Recommended</TableHead>
              <TableHead className="w-[70px] text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.map((game) => {
              const isHighlighted = game.id === highlightedGame;
              return (
                <TableRow
                  key={game.id}
                  ref={(el) => {
                    if (el && highlightedRef.current) {
                      highlightedRef.current.set(game.id, el);
                    }
                  }}
                  className={`cursor-pointer transition-colors ${
                    isHighlighted ? "bg-accent" : ""
                  }`}
                  onMouseEnter={() => onHover(game.id)}
                  onMouseLeave={() => onHover(null)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <a
                        href={game.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium truncate max-w-[400px] hover:text-primary transition-colors"
                        title={game.name}
                      >
                        {game.name}
                      </a>
                      {game.is_pareto && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">
                          Pareto
                        </Badge>
                      )}
                      {game.almost_pareto && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                          Near Pareto
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {game.yearpublished}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {game.bayesaverage.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {game.complexity.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {game.bestwith.length > 0 && (
                        <span className="font-medium">{game.bestwith.join(", ")}</span>
                      )}
                      {game.recommendedwith.length > 0 && (
                        <span className="text-muted-foreground text-xs ml-1">
                          ({game.recommendedwith.join(", ")})
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {game.playing_time}m
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
