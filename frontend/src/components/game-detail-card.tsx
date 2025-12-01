"use client";

import { Game } from "@/types/game";
import { ExternalLink } from "lucide-react";
import { GameMetadata, formatPlayers } from "./game-metadata";
import posthog from "posthog-js";

interface GameDetailCardProps {
  game: Game | null;
}

export function GameDetailCard({ game }: GameDetailCardProps) {
  if (!game) {
    return (
      <div className="rounded-lg border bg-card p-4 h-[120px] sm:h-[180px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Hover over a game to see details</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex gap-4">
        {game.thumbnail && (
          <img src={game.thumbnail} alt={game.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded object-cover shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg leading-tight truncate">{game.name}</h3>
          <p className="text-sm text-muted-foreground">{game.yearpublished}</p>
          <p className="text-sm mt-1">
            {formatPlayers(game, true)}
            {game.bestwith.length > 0 && <span className="text-muted-foreground"> (best: {game.bestwith.join(", ")})</span>}
            <span className="text-muted-foreground ml-2">· {game.playing_time}m</span>
          </p>
        </div>
      </div>

      {game.description && (
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-5">{game.description}</p>
      )}

      <GameMetadata game={game} showPlayersTime={false} />

      <a
        href={game.link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        onClick={() => {
          posthog.capture("external_link_clicked", {
            game_id: game.id,
            game_name: game.name,
            link_location: "detail_card",
          });
        }}
      >
        View on BoardGameGeek
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
