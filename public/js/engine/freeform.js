export const FREEFORM_SNAP_THRESHOLD = 6;

export function resolveFreeformSnap(start, size, lines = [], threshold = FREEFORM_SNAP_THRESHOLD) {
  const safeStart = Number(start);
  const safeSize = Number(size);
  const safeThreshold = Math.max(0, Number(threshold) || 0);
  if (!Number.isFinite(safeStart) || !Number.isFinite(safeSize) || safeSize < 0) return null;

  const anchors = [
    { kind: "start", position: safeStart },
    { kind: "center", position: safeStart + safeSize / 2 },
    { kind: "end", position: safeStart + safeSize }
  ];
  let best = null;

  for (const candidate of lines || []) {
    const line = typeof candidate === "number" ? { position: candidate } : candidate;
    const position = Number(line?.position);
    if (!Number.isFinite(position)) continue;
    for (const anchor of anchors) {
      const offset = position - anchor.position;
      const distance = Math.abs(offset);
      if (distance > safeThreshold) continue;
      if (!best || distance < best.distance) {
        best = { offset, distance, line: position, anchor: anchor.kind, candidate: line };
      }
    }
  }
  return best;
}

export function rectAxisLines(rect, axis = "x", meta = {}) {
  if (!rect) return [];
  const horizontal = axis === "x";
  const start = horizontal ? Number(rect.left) : Number(rect.top);
  const end = horizontal ? Number(rect.right) : Number(rect.bottom);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
  return [
    { ...meta, edge: "start", position: start },
    { ...meta, edge: "center", position: (start + end) / 2 },
    { ...meta, edge: "end", position: end }
  ];
}
