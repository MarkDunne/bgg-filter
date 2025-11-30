"use client";

import { Game } from "@/types/game";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { GameMetadata, PlayerRecommendations } from "./game-metadata";

interface GameTableProps {
  games: Game[];
  highlightedGame: number | null;
  onHover: (id: number | null) => void;
  highlightedRef: React.RefObject<Map<number, HTMLTableRowElement>>;
}

function GameHoverCard({ game, children }: { game: Game; children: React.ReactNode }) {
  const truncatedDescription = game.description.length > 300 ? game.description.slice(0, 300) + "..." : game.description;

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-80 sm:hidden" sideOffset={10}>
        <div className="flex gap-3">
          {game.thumbnail && <img src={game.thumbnail} alt={game.name} className="w-16 h-16 rounded object-cover shrink-0" />}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-tight">{game.name}</h4>
            <p className="text-xs text-muted-foreground">{game.yearpublished}</p>
          </div>
        </div>
        {truncatedDescription && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{truncatedDescription}</p>}
        <div className="mt-3">
          <GameMetadata game={game} compact />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function GameTable({ games, highlightedGame, onHover, highlightedRef }: GameTableProps) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="max-h-[400px] sm:max-h-[800px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="max-w-[200px] sm:max-w-[350px]">Name</TableHead>
              <TableHead className="w-[70px] text-right">Rating</TableHead>
              <TableHead className="w-[80px] text-right">Complexity</TableHead>
              <TableHead className="w-[100px] max-w-[130px]">Recommended</TableHead>
              <TableHead className="w-[50px] text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.map((game) => (
              <TableRow
                key={game.id}
                ref={(el) => { if (el) highlightedRef.current?.set(game.id, el) }}
                className={`cursor-pointer transition-colors ${game.id === highlightedGame ? "bg-accent" : ""}`}
                onMouseEnter={() => onHover(game.id)}
                onMouseLeave={() => onHover(null)}
              >
                <TableCell className="max-w-[200px] sm:max-w-[350px]">
                  <div className="flex items-center gap-2">
                    <GameHoverCard game={game}>
                      <a
                        href={game.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium truncate hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded"
                        aria-label={`${game.name} - opens BoardGameGeek page in new tab`}
                      >
                        {game.name}
                      </a>
                    </GameHoverCard>
                    {game.pareto_rank === 1 && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">Pareto</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{game.yearpublished}</div>
                </TableCell>
                <TableCell className="text-right font-mono">{game.bayesaverage.toFixed(2)}</TableCell>
                <TableCell className="text-right font-mono">{game.complexity.toFixed(2)}</TableCell>
                <TableCell><PlayerRecommendations game={game} /></TableCell>
                <TableCell className="text-right text-muted-foreground">{game.playing_time}m</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
