export const FREEFORM_SNAP_THRESHOLD = 6;

/**
 * Recouvrement minimal (part de la surface déplacée) pour qu'un dépôt magnétique
 * soit accepté. Un simple effleurement ne doit pas attacher l'image : il faut
 * vraiment la poser sur l'emplacement.
 */
export const FREEFORM_DROP_COVERAGE = 0.6;

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

export function marqueeRectFromPoints(start, end) {
  const x1 = Number(start?.x);
  const y1 = Number(start?.y);
  const x2 = Number(end?.x);
  const y2 = Number(end?.y);
  if (![x1, y1, x2, y2].every(Number.isFinite)) return null;
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const right = Math.max(x1, x2);
  const bottom = Math.max(y1, y2);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

export function marqueeContainsRectCenter(marquee, rect) {
  if (!marquee || !rect) return false;
  const cx = (Number(rect.left) + Number(rect.right)) / 2;
  const cy = (Number(rect.top) + Number(rect.bottom)) / 2;
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return false;
  return cx >= marquee.left && cx <= marquee.right && cy >= marquee.top && cy <= marquee.bottom;
}

export function resolveEqualSpacingSnap(rect, neighbors = [], axis = "x", threshold = FREEFORM_SNAP_THRESHOLD) {
  if (!rect) return null;
  const horizontal = axis === "x";
  const start = horizontal ? Number(rect.left) : Number(rect.top);
  const end = horizontal ? Number(rect.right) : Number(rect.bottom);
  const crossStart = horizontal ? Number(rect.top) : Number(rect.left);
  const crossEnd = horizontal ? Number(rect.bottom) : Number(rect.right);
  if (![start, end, crossStart, crossEnd].every(Number.isFinite)) return null;
  const parsed = (neighbors || []).map(candidate => {
    const r = candidate?.rect || candidate;
    if (!r) return null;
    const cStart = horizontal ? Number(r.left) : Number(r.top);
    const cEnd = horizontal ? Number(r.right) : Number(r.bottom);
    const cCrossStart = horizontal ? Number(r.top) : Number(r.left);
    const cCrossEnd = horizontal ? Number(r.bottom) : Number(r.right);
    if (![cStart, cEnd, cCrossStart, cCrossEnd].every(Number.isFinite)) return null;
    const crossOverlap = Math.min(crossEnd, cCrossEnd) - Math.max(crossStart, cCrossStart);
    return crossOverlap > 0 ? { source: candidate, rect: r, start: cStart, end: cEnd } : null;
  }).filter(Boolean);
  const befores = parsed.filter(item => item.end <= start + threshold);
  const afters = parsed.filter(item => item.start >= end - threshold);
  const size = end - start;
  const safeThreshold = Math.max(0, Number(threshold) || 0);
  let best = null;
  for (const before of befores) {
    for (const after of afters) {
      const available = after.start - before.end;
      if (available < size) continue;
      const gap = (available - size) / 2;
      const targetStart = before.end + gap;
      const offset = targetStart - start;
      const distance = Math.abs(offset);
      if (distance > safeThreshold) continue;
      const span = after.start - before.end;
      if (!best || distance < best.distance || (distance === best.distance && span < best.span)) {
        best = { axis, offset, gap, before: before.rect, after: after.rect, distance, span };
      }
    }
  }
  if (!best) return null;
  const { distance, span, ...result } = best;
  return result;
}

export const FREEFORM_VIEWPORT_WIDTHS = Object.freeze({ desktop: 1200, tablet: 768, mobile: 390 });

export function adaptFreeformLayoutToViewport(layout = {}, sourceViewport = "desktop", targetViewport = "mobile") {
  const sourceWidth = FREEFORM_VIEWPORT_WIDTHS[sourceViewport] || FREEFORM_VIEWPORT_WIDTHS.desktop;
  const targetWidth = FREEFORM_VIEWPORT_WIDTHS[targetViewport] || sourceWidth;
  const ratio = targetWidth / sourceWidth;
  const next = { ...layout };
  for (const key of ["x", "y", "width", "height"]) {
    const value = Number(layout?.[key]);
    if (Number.isFinite(value)) next[key] = Math.round(value * ratio * 100) / 100;
  }
  return next;
}

export function resolveEdgeAutoScroll(pointerY, rect, margin = 56, maxSpeed = 22) {
  const y = Number(pointerY);
  const top = Number(rect?.top);
  const bottom = Number(rect?.bottom);
  const safeMargin = Math.max(1, Number(margin) || 56);
  const safeMax = Math.max(1, Number(maxSpeed) || 22);
  if (![y, top, bottom].every(Number.isFinite) || bottom <= top) return 0;
  if (y < top || y > bottom) return 0;
  if (y < top + safeMargin) {
    const strength = Math.min(1, (top + safeMargin - y) / safeMargin);
    return -Math.max(1, Math.round(safeMax * strength));
  }
  if (y > bottom - safeMargin) {
    const strength = Math.min(1, (y - (bottom - safeMargin)) / safeMargin);
    return Math.max(1, Math.round(safeMax * strength));
  }
  return 0;
}
