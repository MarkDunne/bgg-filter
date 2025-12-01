"use client";

import { Game } from "@/types/game";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GameMetadata, PlayerRecommendations } from "./game-metadata";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import posthog from "posthog-js";

const MAX_DESCRIPTION_LENGTH = 500;

interface GameTableProps {
  games: Game[];
  highlightedGame: number | null;
  mobileSelectedGame: number | null;
  onHover: (id: number | null) => void;
  onMobileClick: (id: number) => void;
  highlightedRef: React.RefObject<Map<number, HTMLTableRowElement>>;
}

const truncateDescription = (text: string, maxLength: number) =>
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

interface MobileGameCardProps {
  game: Game;
  isExpanded: boolean;
  onClick: () => void;
}

function MobileGameCard({ game, isExpanded, onClick }: MobileGameCardProps) {
  const ChevronIcon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button onClick={onClick} className="w-full p-4 text-left hover:bg-accent/50 transition-colors">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight break-words">{game.name}</h3>
            {game.goldilocks_score === 1 && <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">Goldilocks</Badge>}
          </div>
          <ChevronIcon className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>

        <div className="flex gap-3">
          {game.thumbnail && (
            <img src={game.thumbnail} alt={game.name} className="w-16 h-16 rounded object-cover shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-2">{game.yearpublished}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              <span className="text-muted-foreground">Rating: <span className="font-mono font-medium">{game.bayesaverage.toFixed(2)}</span></span>
              <span className="text-muted-foreground">Complexity: <span className="font-mono font-medium">{game.complexity.toFixed(2)}</span></span>
              <span className="text-muted-foreground">Goldilocks Score: <span className="font-medium">{game.goldilocks_score}</span></span>
              <span className="text-muted-foreground">Time: <span className="font-medium">{game.playing_time}m</span></span>
              {game.bestwith.length > 0 && (
                <span className="text-muted-foreground">Best with: <span className="font-medium">{game.bestwith.join(", ")}</span></span>
              )}
            </div>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
          {game.description && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed whitespace-pre-wrap break-words">
              {truncateDescription(game.description, MAX_DESCRIPTION_LENGTH)}
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
            onClick={(e) => {
              e.stopPropagation();
              posthog.capture("external_link_clicked", {
                game_id: game.id,
                game_name: game.name,
                link_location: "mobile_card",
              });
            }}
          >
            View on BoardGameGeek
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}

interface DesktopTableRowProps {
  game: Game;
  isHighlighted: boolean;
  onHover: (id: number | null) => void;
  highlightedRef: React.RefObject<Map<number, HTMLTableRowElement>>;
}

function DesktopTableRow({ game, isHighlighted, onHover, highlightedRef }: DesktopTableRowProps) {
  return (
    <TableRow
      ref={(el) => {
        if (el) highlightedRef.current?.set(game.id, el);
      }}
      className={cn("cursor-pointer transition-colors", isHighlighted && "bg-accent")}
      onMouseEnter={() => onHover(game.id)}
      onMouseLeave={() => onHover(null)}
    >
      <TableCell className="max-w-[350px] overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <a
            href={game.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              posthog.capture("external_link_clicked", {
                game_id: game.id,
                game_name: game.name,
                link_location: "desktop_table",
              });
            }}
            className="font-medium truncate hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded block min-w-0"
            aria-label={`${game.name} - opens BoardGameGeek page in new tab`}
          >
            {game.name}
          </a>
          {game.goldilocks_score === 1 && <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">Goldilocks</Badge>}
        </div>
        <div className="text-xs text-muted-foreground truncate">{game.yearpublished}</div>
      </TableCell>
      <TableCell className="text-right font-mono">{game.bayesaverage.toFixed(2)}</TableCell>
      <TableCell className="text-right font-mono">{game.complexity.toFixed(2)}</TableCell>
      <TableCell className="text-right font-medium">{game.goldilocks_score}</TableCell>
      <TableCell><PlayerRecommendations game={game} /></TableCell>
      <TableCell className="text-right text-muted-foreground">{game.playing_time}m</TableCell>
    </TableRow>
  );
}

export function GameTable({ games, highlightedGame, mobileSelectedGame, onHover, onMobileClick, highlightedRef }: GameTableProps) {
  return (
    <>
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

      <div className="hidden sm:block rounded-lg border bg-card overflow-hidden">
        <div className="max-h-[800px] overflow-y-auto overflow-x-hidden">
          <Table className="w-full table-fixed">
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="max-w-[350px]">Name</TableHead>
                <TableHead className="w-[70px] text-right">Rating</TableHead>
                <TableHead className="w-[80px] text-right">Complexity</TableHead>
                <TableHead className="w-[90px] text-right">Goldilocks</TableHead>
                <TableHead className="w-[100px] max-w-[130px]">Recommended</TableHead>
                <TableHead className="w-[50px] text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => (
                <DesktopTableRow
                  key={game.id}
                  game={game}
                  isHighlighted={game.id === highlightedGame}
                  onHover={onHover}
                  highlightedRef={highlightedRef}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
