export function isValidMapBounds(bounds) {
  return (
    Array.isArray(bounds) &&
    bounds.length === 2 &&
    bounds.every(
      pair =>
        Array.isArray(pair) &&
        pair.length === 2 &&
        pair.every(value => Number.isFinite(value))
    )
  )
}

export function getMapZoomFromBounds(bounds, fallbackZoom = 1) {
  if (!isValidMapBounds(bounds)) {
    return fallbackZoom
  }

  const latSpan = Math.abs(bounds[1][0] - bounds[0][0])
  const lngSpan = Math.abs(bounds[1][1] - bounds[0][1])
  const maxSpan = Math.max(latSpan, lngSpan)

  if (maxSpan <= 0) {
    return fallbackZoom
  }

  return Math.round(Math.log2(360 / maxSpan))
}
