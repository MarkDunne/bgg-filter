import { useState, useRef, useCallback } from "react";

export function useGameSelection() {
  const [highlightedGame, setHighlightedGame] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  const handleHover = useCallback((id: number | null) => {
    setHighlightedGame(id);
    if (id !== null) setSelectedGame(id);
  }, []);

  const handleScatterClick = useCallback((id: number) => {
    const row = rowRefs.current.get(id);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedGame(id);
      setTimeout(() => setHighlightedGame(null), 2000);
    }
  }, []);

  return {
    highlightedGame,
    selectedGame,
    rowRefs,
    handleHover,
    handleScatterClick,
  };
}
