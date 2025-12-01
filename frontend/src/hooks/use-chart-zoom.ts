import { useState, useCallback, useRef } from "react";
import posthog from "posthog-js";

interface Bounds {
  left: number
  right: number
  bottom: number
  top: number
}

interface DragCoords {
  x: number
  y: number
}

const CHART_MARGINS = { left: 40, right: 10, top: 10, bottom: 30 }

export function useChartZoom(naturalBounds: Bounds) {
  const [zoom, setZoom] = useState<Bounds | null>(null)
  const [dragStart, setDragStart] = useState<DragCoords | null>(null)
  const [dragEnd, setDragEnd] = useState<DragCoords | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  const currentBounds = zoom ?? naturalBounds
  const isZoomed = zoom !== null
  const isSelecting = dragStart !== null && dragEnd !== null

  const getDataCoords = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): DragCoords | null => {
      if (!chartRef.current) return null

      const rect = chartRef.current.getBoundingClientRect()
      const chartWidth = rect.width - CHART_MARGINS.left - CHART_MARGINS.right
      const chartHeight = rect.height - CHART_MARGINS.top - CHART_MARGINS.bottom

      const x = e.clientX - rect.left - CHART_MARGINS.left
      const y = e.clientY - rect.top - CHART_MARGINS.top

      if (x < 0 || x > chartWidth || y < 0 || y > chartHeight) return null

      const xRatio = x / chartWidth
      const yRatio = 1 - y / chartHeight

      return {
        x: currentBounds.left + xRatio * (currentBounds.right - currentBounds.left),
        y: currentBounds.bottom + yRatio * (currentBounds.top - currentBounds.bottom),
      }
    },
    [currentBounds]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const coords = getDataCoords(e)
      if (coords) {
        setDragStart(coords)
        setDragEnd(null)
      }
    },
    [getDataCoords]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (dragStart) {
        const coords = getDataCoords(e)
        if (coords) setDragEnd(coords)
      }
    },
    [dragStart, getDataCoords]
  )

  const handleMouseUp = useCallback(() => {
    if (dragStart && dragEnd) {
      const x1 = Math.min(dragStart.x, dragEnd.x)
      const x2 = Math.max(dragStart.x, dragEnd.x)
      const y1 = Math.min(dragStart.y, dragEnd.y)
      const y2 = Math.max(dragStart.y, dragEnd.y)

      if (x2 - x1 > 0.02 && y2 - y1 > 0.05) {
        setZoom({ left: x1, right: x2, bottom: y1, top: y2 })
        posthog.capture("chart_zoomed", {
          rating_min: x1.toFixed(2),
          rating_max: x2.toFixed(2),
          complexity_min: y1.toFixed(2),
          complexity_max: y2.toFixed(2),
        });
      }
    }
    setDragStart(null)
    setDragEnd(null)
  }, [dragStart, dragEnd])

  const handleMouseLeave = useCallback(() => {
    setDragStart(null)
    setDragEnd(null)
  }, [])

  const resetZoom = useCallback(() => setZoom(null), [])

  const selectionArea = isSelecting
    ? {
        x1: dragStart!.x,
        x2: dragEnd!.x,
        y1: dragStart!.y,
        y2: dragEnd!.y,
      }
    : null

  return {
    chartRef,
    currentBounds,
    isZoomed,
    isSelecting,
    selectionArea,
    resetZoom,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
  }
}
