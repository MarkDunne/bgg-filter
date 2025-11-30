"use client";

import React from "react";
import { Game } from "@/types/game";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GameMetadata, PlayerRecommendations, formatPlayers } from "./game-metadata";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface GameTableProps {
  games: Game[];
  highlightedGame: number | null;
  mobileSelectedGame: number | null;
  onHover: (id: number | null) => void;
  onMobileClick: (id: number) => void;
  highlightedRef: React.RefObject<Map<number, HTMLTableRowElement>>;
}

function MobileGameCard({ game, isExpanded, onClick }: { game: Game; isExpanded: boolean; onClick: () => void }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        onClick={onClick}
        className="w-full p-4 text-left hover:bg-accent/50 transition-colors"
      >
        {/* Title row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight break-words">{game.name}</h3>
            {game.pareto_rank === 1 && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">Pareto</Badge>
            )}
          </div>
          <div className="shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Content row: thumbnail on left, details on right */}
        <div className="flex gap-3">
          {game.thumbnail && (
            <img 
              src={game.thumbnail} 
              alt={game.name} 
              className="w-16 h-16 rounded object-cover shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-2">{game.yearpublished}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Rating: </span>
                <span className="font-mono font-medium">{game.bayesaverage.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Complexity: </span>
                <span className="font-mono font-medium">{game.complexity.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Time: </span>
                <span className="font-medium">{game.playing_time}m</span>
              </div>
              {game.bestwith.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Best with: </span>
                  <span className="font-medium">{game.bestwith.join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
          {game.description && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed whitespace-pre-wrap break-words">
              {game.description.length > 500 ? game.description.slice(0, 500) + "..." : game.description}
            </p>
          )}

          <div className="mb-4">
            <GameMetadata game={game} showPlayersTime={false} />
          </div>

          <a
            href={game.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View on BoardGameGeek
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}

export function GameTable({ games, highlightedGame, mobileSelectedGame, onHover, onMobileClick, highlightedRef }: GameTableProps) {
  const handleRowClick = (gameId: number, e: React.MouseEvent) => {
    // Only handle clicks on mobile devices (screen width < 640px matches Tailwind's sm breakpoint)
    // The expanded row is already hidden on desktop with sm:hidden, but we avoid unnecessary state updates
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    if (isMobile) {
      onMobileClick(gameId);
    }
  };

  return (
    <>
      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3 max-h-[400px] overflow-y-auto">
        {games.map((game) => (
          <MobileGameCard
            key={game.id}
            game={game}
            isExpanded={game.id === mobileSelectedGame}
            onClick={() => onMobileClick(game.id)}
          />
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block rounded-lg border bg-card overflow-hidden w-full max-w-full">
        <div className="max-h-[800px] overflow-y-auto overflow-x-hidden w-full">
          <Table className="w-full table-fixed">
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="max-w-[350px]">Name</TableHead>
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
                  <TableCell className="max-w-[350px] overflow-hidden">
                    <div className="flex items-center gap-2 min-w-0">
                      <a
                        href={game.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium truncate hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded block min-w-0"
                        aria-label={`${game.name} - opens BoardGameGeek page in new tab`}
                      >
                        {game.name}
                      </a>
                      {game.pareto_rank === 1 && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0 flex-shrink-0">Pareto</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{game.yearpublished}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono overflow-hidden">{game.bayesaverage.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono overflow-hidden">{game.complexity.toFixed(2)}</TableCell>
                  <TableCell className="overflow-hidden"><PlayerRecommendations game={game} /></TableCell>
                  <TableCell className="text-right text-muted-foreground overflow-hidden">{game.playing_time}m</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
