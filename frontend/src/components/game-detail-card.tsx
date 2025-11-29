"use client";

import { Game } from "@/types/game";
import { Users, Clock, Layers, Cog, ExternalLink } from "lucide-react";

interface GameDetailCardProps {
  game: Game | null;
}

export function GameDetailCard({ game }: GameDetailCardProps) {
  if (!game) {
    return (
      <div className="rounded-lg border bg-card p-4 h-[120px] sm:h-[180px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Hover over a game to see details
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex gap-4">
        {game.thumbnail && (
          <img
            src={game.thumbnail}
            alt={game.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg leading-tight truncate">
            {game.name}
          </h3>
          <p className="text-sm text-muted-foreground">{game.yearpublished}</p>

          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {game.min_players === game.max_players
                  ? `${game.min_players}p`
                  : `${game.min_players}-${game.max_players}p`}
                {game.bestwith.length > 0 && (
                  <span className="text-muted-foreground"> (best: {game.bestwith.join(", ")})</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{game.playing_time}m</span>
            </div>
          </div>
        </div>
      </div>

      {game.description && (
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-5">
          {game.description}
        </p>
      )}

      <div className="mt-3 space-y-1.5 text-sm">
        {game.categories.length > 0 && (
          <div className="flex items-start gap-1.5">
            <Layers className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground line-clamp-1">{game.categories.join(", ")}</span>
          </div>
        )}
        {game.mechanics.length > 0 && (
          <div className="flex items-start gap-1.5">
            <Cog className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground line-clamp-1">{game.mechanics.join(", ")}</span>
          </div>
        )}
      </div>

      <a
        href={game.link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        View on BoardGameGeek
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
