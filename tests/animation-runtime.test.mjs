import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVisibleLoop, initializeNearViewport } from '../assets/animation-runtime.mjs';

function environment() {
  let id = 0;
  const queue = new Map(), listeners = new Map(), observers = [];
  globalThis.requestAnimationFrame = fn => { queue.set(++id, fn); return id; };
  globalThis.cancelAnimationFrame = key => queue.delete(key);
  globalThis.document = {
    hidden: false,
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name)
  };
  globalThis.IntersectionObserver = class {
    constructor(fn) { this.fn = fn; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  };
  return {
    queue, observers,
    frame(now) { const pending = [...queue.values()]; queue.clear(); pending.forEach(fn => fn(now)); },
    visible(value) { observers[0].fn([{ isIntersecting: value }]); },
    hidden(value) { document.hidden = value; listeners.get('visibilitychange')?.(); }
  };
}

test('offscreen scenes schedule no work; repeated observer events do not duplicate loops', () => {
  const env = environment(); let draws = 0;
  const loop = createVisibleLoop({}, () => draws++);
  assert.equal(env.queue.size, 0);
  env.visible(true); env.visible(true);
  assert.equal(env.queue.size, 1);
  env.frame(0); assert.equal(draws, 1);
  env.visible(false); assert.equal(env.queue.size, 0);
  env.frame(100); assert.equal(draws, 1);
  env.visible(true); env.frame(200); assert.equal(draws, 2);
  loop.dispose(); assert.equal(env.queue.size, 0);
});

test('hidden tabs suspend work and resume with a bounded simulation delta', () => {
  const env = environment(), deltas = [];
  createVisibleLoop({}, (_, delta) => deltas.push(delta));
  env.visible(true); env.frame(0);
  env.hidden(true); assert.equal(env.queue.size, 0);
  env.hidden(false); env.frame(600000);
  assert.ok(deltas.every(delta => delta <= 0.05));
  assert.equal(deltas.length, 2);
});

test('240 Hz displays do not drive decorative scenes at 240 renders per second', () => {
  for (const fps of [15, 30, 60]) {
    const env = environment(); let draws = 0;
    createVisibleLoop({}, () => draws++, { fps });
    env.visible(true);
    for (let i = 0; i < 480; i++) env.frame(i * 1000 / 240);
    assert.ok(draws >= fps * 2 - 2 && draws <= fps * 2 + 2, `${fps} target: ${draws} draws`);
  }
});

test('a deferred scene initializes once when approaching the viewport', () => {
  const env = environment(); let count = 0;
  initializeNearViewport({}, () => count++);
  env.visible(false); assert.equal(count, 0);
  env.visible(true); assert.equal(count, 1);
  assert.ok(env.observers[0].disconnected);
});
