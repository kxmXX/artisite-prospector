import test from 'node:test';
import assert from 'node:assert/strict';
import { TRADES } from '../public/js/data/trades.js';

test('chaque comparateur avant/apres de demonstration a deux images distinctes', () => {
  for (const trade of TRADES) {
    const pairs = [];
    if (trade.beforeAfter?.beforeImage) pairs.push(trade.beforeAfter);
    for (const item of trade.gallery || []) {
      if (item.beforeImage || item.afterImage) pairs.push(item);
    }
    for (const pair of pairs) {
      assert.ok(pair.beforeImage, trade.id + ': image avant manquante');
      assert.ok(pair.afterImage, trade.id + ': image apres manquante');
      assert.notEqual(pair.beforeImage, pair.afterImage, trade.id + ': comparateur sans difference visible');
    }
  }
});
