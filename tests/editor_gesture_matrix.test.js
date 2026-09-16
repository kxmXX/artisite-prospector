import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  FREEFORM_SNAP_THRESHOLD,
  resolveFreeformSnap,
  rectAxisLines,
  marqueeRectFromPoints,
  marqueeContainsRectCenter,
  resolveEqualSpacingSnap,
  adaptFreeformLayoutToViewport,
  resolveEdgeAutoScroll
} from '../public/js/engine/freeform.js';

import { generateSite } from '../public/js/engine/generator.js';
import { renderWebsiteHTML } from '../public/js/components/renderer.js';

const appSource = fs.readFileSync(new URL('../public/js/app.js', import.meta.url), 'utf8');
const studioCss = fs.readFileSync(new URL('../public/css/studio-v3.css', import.meta.url), 'utf8');

test('matrix / mouse: snapping locks to the nearest anchor inside the threshold', () => {
  assert.equal(FREEFORM_SNAP_THRESHOLD, 6);
  const near = resolveFreeformSnap(100, 50, [{ position: 104 }], 6);
  assert.equal(near.offset, 4);
  assert.equal(near.anchor, 'start');
  const centre = resolveFreeformSnap(100, 50, [{ position: 126 }], 6);
  assert.equal(centre.offset, 1);
  assert.equal(centre.anchor, 'center');
  assert.equal(resolveFreeformSnap(100, 50, [{ position: 110 }], 6), null, 'far lines never snap');
  assert.equal(resolveFreeformSnap(Number.NaN, 50, [{ position: 104 }], 6), null);
  assert.equal(resolveFreeformSnap(100, -1, [{ position: 104 }], 6), null);
});

test('matrix / mouse: axis lines expose start, centre and end for alignment', () => {
  const lines = rectAxisLines({ left: 10, right: 50 }, 'x', { source: 'element' });
  assert.deepEqual(lines.map(line => line.position), [10, 30, 50]);
  assert.deepEqual(lines.map(line => line.edge), ['start', 'center', 'end']);
  assert.ok(lines.every(line => line.source === 'element'));
});

test('matrix / mouse + touch: equal spacing resolves the shared gap', () => {
  const rect = { left: 100, right: 140, top: 0, bottom: 40 };
  const before = { left: 20, right: 60, top: 0, bottom: 40 };
  const after = { left: 180, right: 220, top: 0, bottom: 40 };
  const spacing = resolveEqualSpacingSnap(rect, [{ rect: before }, { rect: after }], 'x', 6);
  assert.ok(spacing, 'an equally spaced gap must be detected');
  assert.equal(spacing.offset, 0);
  assert.equal(spacing.gap, 40);
  assert.equal(spacing.axis, 'x');
  assert.equal(resolveEqualSpacingSnap(rect, [], 'x', 6), null);
});

test('matrix / mouse: marquee selects only rects whose centre is inside', () => {
  const marquee = marqueeRectFromPoints({ x: 10, y: 20 }, { x: 110, y: 80 });
  assert.deepEqual(marquee, { left: 10, top: 20, right: 110, bottom: 80, width: 100, height: 60 });
  assert.equal(marqueeContainsRectCenter(marquee, { left: 40, right: 60, top: 40, bottom: 60 }), true);
  assert.equal(marqueeContainsRectCenter(marquee, { left: 200, right: 220, top: 40, bottom: 60 }), false);
  assert.equal(marqueeRectFromPoints({ x: 1, y: 2 }, { x: Number.NaN, y: 4 }), null);
});

test('matrix / touch: edge auto-scroll pushes away from the pointer within the host', () => {
  const rect = { top: 100, bottom: 500 };
  const top = resolveEdgeAutoScroll(105, rect, 56, 22);
  assert.ok(top < 0 && top >= -22, 'near the top the canvas scrolls up');
  const bottom = resolveEdgeAutoScroll(460, rect, 56, 22);
  assert.ok(bottom > 0 && bottom <= 22, 'near the bottom the canvas scrolls down');
  assert.equal(resolveEdgeAutoScroll(300, rect, 56, 22), 0, 'the middle never scrolls');
  assert.equal(resolveEdgeAutoScroll(50, rect, 56, 22), 0, 'outside the host never scrolls');
  assert.equal(resolveEdgeAutoScroll(120, { top: 100, bottom: 100 }, 56, 22), 0);
});

test('matrix / responsive: a layout scales with the target breakpoint width', () => {
  const adapted = adaptFreeformLayoutToViewport({ x: 120, y: 60, width: 600, height: 300, rotation: 30, z: 4 }, 'desktop', 'mobile');
  assert.equal(adapted.x, 39);
  assert.equal(adapted.y, 19.5);
  assert.equal(adapted.width, 195);
  assert.equal(adapted.height, 97.5);
  assert.equal(adapted.rotation, 30, 'rotation is breakpoint independent');
  assert.equal(adapted.z, 4);
});

test('matrix / mouse: pointer capture drives drag, resize and rotation', () => {
  assert.ok(appSource.includes('canvas.addEventListener("pointerdown"'));
  assert.ok(appSource.includes('window.addEventListener("pointermove"'));
  assert.ok(appSource.includes('window.addEventListener("pointerup"'));
  assert.ok(appSource.includes('data-freeform-handle'));
  assert.ok(appSource.includes('data-freeform-rotate'));
  assert.ok(appSource.includes('startFreeformRotation(event)'));
});

test('matrix / touch: pointer type, edge auto-scroll and coarse targets are wired', () => {
  assert.ok(appSource.includes('event.pointerType === "touch"'));
  assert.ok(appSource.includes('resolveEdgeAutoScroll(lastPointer.clientY'));
  assert.ok(studioCss.includes('touch-action:none'));
  assert.ok(studioCss.includes('@media(pointer:coarse)'));
  assert.ok(studioCss.includes('[data-freeform-additive]'));
});

test('matrix / keyboard: nudge, escape, group and snapping are wired', () => {
  assert.ok(appSource.includes('event.key === "ArrowLeft"'));
  assert.ok(appSource.includes('const step = event.shiftKey ? 10 : 1'));
  assert.ok(appSource.includes('this.nudgeFreeformSelection(-step, 0)'));
  assert.ok(appSource.includes('event.key === "Escape"'));
  assert.ok(appSource.includes('this.clearFreeformSelection()'));
  assert.ok(appSource.includes('this.groupFreeformSelection()'));
  assert.ok(appSource.includes('this.ungroupFreeformSelection()'));
  assert.ok(appSource.includes('Math.round(delta / 15) * 15'), 'Shift rotates on a 15 degree step');
  assert.ok(appSource.includes('moveEvent.shiftKey || entry.base.aspectLocked === true'));
});
test('matrix / tablet: une mise en page passe au gabarit tablette en gardant la rotation', () => {
  const layout = { x: 120, y: 60, width: 600, height: 300, rotation: 30, z: 4 };
  const tablet = adaptFreeformLayoutToViewport(layout, 'desktop', 'tablet');
  assert.equal(tablet.x, 76.8);
  assert.equal(tablet.y, 38.4);
  assert.equal(tablet.width, 384);
  assert.equal(tablet.height, 192);
  assert.equal(tablet.rotation, 30, 'la rotation ne depend pas du breakpoint');
  assert.equal(tablet.z, 4);
  // Aller-retour tablette -> desktop : on retrouve la géométrie d'origine.
  const back = adaptFreeformLayoutToViewport(tablet, 'tablet', 'desktop');
  assert.equal(back.width, 600);
  assert.equal(back.height, 300);
  assert.equal(back.rotation, 30);
});

test('matrix / touch: la multi-selection additive est cablee pour le doigt', () => {
  assert.ok(appSource.includes('data-freeform-additive'), 'le bouton Multi + doit exister');
  assert.ok(appSource.includes('_freeformAdditiveMode'), 'le mode additif doit etre suivi');
  assert.ok(appSource.includes('aria-pressed'), 'le bouton doit annoncer son etat');
  assert.ok(appSource.includes('event.shiftKey || this._freeformAdditiveMode'),
    'le doigt et le clavier doivent partager la meme addition de selection');
  assert.ok(studioCss.includes('@media(pointer:coarse)'), 'les cibles tactiles doivent etre agrandies');
});

test('matrix / export: la geometrie libre est publiee a l identique', () => {
  const project = generateSite({ name: 'Parite Export', tradeId: 'menuisier', city: 'Lyon' });
  project.freeformLayout = { desktop: { abc123: { x: 10, y: 20, width: 300, height: 100, rotation: 15 } } };
  const published = renderWebsiteHTML(project, { isEditor: false });
  const rule = published.match(/\.artisite-root\.public-mode \[data-layout-key="abc123"\]\{([^}]*)\}/);
  assert.ok(rule, 'le site publie doit porter la regle de position libre');
  const body = rule[1];
  assert.ok(body.includes('translate:10px 20px'), 'la position doit etre conservee');
  assert.ok(body.includes('width:300px'), 'la largeur doit etre conservee');
  assert.ok(body.includes('height:100px'), 'la hauteur doit etre conservee');
  assert.ok(body.includes('rotate:15deg'), 'la rotation doit etre conservee');
});

