import test from "node:test";
import assert from "node:assert/strict";
import { FREEFORM_SNAP_THRESHOLD, rectAxisLines, resolveFreeformSnap } from "../public/js/engine/freeform.js";

test("freeform snap chooses the nearest edge or center inside the threshold", () => {
  const snap = resolveFreeformSnap(96, 40, [{ position: 120, source: "peer" }]);
  assert.equal(snap.offset, 4);
  assert.equal(snap.anchor, "center");
  assert.equal(snap.line, 120);
  assert.equal(snap.candidate.source, "peer");
});

test("freeform snap prefers the closest candidate across all anchors", () => {
  const snap = resolveFreeformSnap(100, 20, [92, 105, 121]);
  assert.equal(snap.offset, 1);
  assert.equal(snap.anchor, "end");
  assert.equal(snap.line, 121);
});

test("freeform snap returns null outside the six pixel default threshold", () => {
  assert.equal(FREEFORM_SNAP_THRESHOLD, 6);
  assert.equal(resolveFreeformSnap(100, 20, [127]), null);
});

test("freeform snap threshold is inclusive and configurable", () => {
  assert.equal(resolveFreeformSnap(100, 20, [126])?.offset, 6);
  assert.equal(resolveFreeformSnap(100, 20, [128], 8)?.offset, 8);
});

test("rectAxisLines exposes start, center and end for both axes", () => {
  const rect = { left: 10, right: 50, top: 20, bottom: 80 };
  assert.deepEqual(rectAxisLines(rect, "x", { source: "section" }).map(line => line.position), [10, 30, 50]);
  assert.deepEqual(rectAxisLines(rect, "y").map(line => line.position), [20, 50, 80]);
});

test("marquee geometry normalizes reverse drags and selects by element center", async () => {
  const { marqueeContainsRectCenter, marqueeRectFromPoints } = await import("../public/js/engine/freeform.js");
  const marquee = marqueeRectFromPoints({ x: 100, y: 80 }, { x: 20, y: 10 });
  assert.deepEqual(marquee, { left: 20, top: 10, right: 100, bottom: 80, width: 80, height: 70 });
  assert.equal(marqueeContainsRectCenter(marquee, { left: 40, right: 60, top: 30, bottom: 50 }), true);
  assert.equal(marqueeContainsRectCenter(marquee, { left: 95, right: 125, top: 30, bottom: 50 }), false);
});
