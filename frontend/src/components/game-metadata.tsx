"use client";

import { Game } from "@/types/game";
import { Users, Clock, Layers, Cog } from "lucide-react";

interface GameMetadataProps {
  game: Game;
  compact?: boolean;
  showPlayersTime?: boolean;
}

export function formatPlayers(game: Game, compact = false): string {
  const suffix = compact ? "p" : " players";
  return game.min_players === game.max_players
    ? `${game.min_players}${suffix}`
    : `${game.min_players}-${game.max_players}${suffix}`;
}

export function PlayerRecommendations({ game }: { game: Game }) {
  if (!game.bestwith.length && !game.recommendedwith.length) return null;
  return (
    <span className="text-sm">
      {game.bestwith.length > 0 && <span className="font-medium">{game.bestwith.join(", ")}</span>}
      {game.recommendedwith.length > 0 && (
        <span className="text-muted-foreground text-xs ml-1">({game.recommendedwith.join(", ")})</span>
      )}
    </span>
  );
}

export function GameMetadata({ game, compact = false, showPlayersTime = true }: GameMetadataProps) {
  const iconSize = compact ? "h-3 w-3" : "h-4 w-4";
  const textSize = compact ? "text-xs" : "text-sm";
  const gap = compact ? "gap-2" : "gap-1.5";

  return (
    <div className={`space-y-2 ${textSize} mt-3`}>
      {showPlayersTime && (
        <>
          <div className={`flex items-center ${gap}`}>
            <Users className={`${iconSize} text-muted-foreground shrink-0`} />
            <span>
              {formatPlayers(game, compact)}
              {game.bestwith.length > 0 && <span className="text-muted-foreground"> (best: {game.bestwith.join(", ")})</span>}
            </span>
          </div>
          <div className={`flex items-center ${gap}`}>
            <Clock className={`${iconSize} text-muted-foreground shrink-0`} />
            <span>{game.playing_time}{compact ? "m" : " minutes"}</span>
          </div>
        </>
      )}
      {game.categories.length > 0 && (
        <div className={`flex items-start ${gap} min-w-0`}>
          <Layers className={`${iconSize} text-muted-foreground shrink-0 flex-shrink-0 mt-0.5`} />
          <span className={`text-muted-foreground min-w-0 ${compact ? "break-words" : "line-clamp-1 break-words"}`}>{game.categories.join(", ")}</span>
        </div>
      )}
      {game.mechanics.length > 0 && (
        <div className={`flex items-start ${gap} min-w-0`}>
          <Cog className={`${iconSize} text-muted-foreground shrink-0 flex-shrink-0 mt-0.5`} />
          <span className={`text-muted-foreground min-w-0 ${compact ? "break-words" : "line-clamp-1 break-words"}`}>{game.mechanics.join(", ")}</span>
        </div>
      )}
    </div>
  );
}
