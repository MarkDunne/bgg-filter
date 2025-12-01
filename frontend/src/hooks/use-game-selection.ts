import { useState, useRef, useCallback } from "react";
import posthog from "posthog-js";

export function useGameSelection() {
  const [highlightedGame, setHighlightedGame] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [mobileSelectedGame, setMobileSelectedGame] = useState<number | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  const handleHover = useCallback((id: number | null) => {
    setHighlightedGame(id);
    if (id !== null) {
      setSelectedGame(id);
      posthog.capture("game_selected", {
        game_id: id,
        selection_method: "hover",
      });
    }
  }, []);

  const handleMobileClick = useCallback((id: number) => {
    const isExpanding = mobileSelectedGame !== id;
    setMobileSelectedGame((prev) => (prev === id ? null : id));
    if (isExpanding) {
      posthog.capture("mobile_game_expanded", {
        game_id: id,
      });
    }
  }, [mobileSelectedGame]);

  const handleScatterClick = useCallback((id: number) => {
    const row = rowRefs.current.get(id);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedGame(id);
      setTimeout(() => setHighlightedGame(null), 2000);
      posthog.capture("scatter_plot_game_clicked", {
        game_id: id,
      });
    }
  }, []);

  return {
    highlightedGame,
    selectedGame,
    mobileSelectedGame,
    rowRefs,
    handleHover,
    handleMobileClick,
    handleScatterClick,
  };
}
