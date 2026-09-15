/** Visibility-aware, refresh-rate-independent scheduling for decorative scenes. */
export function createVisibleLoop(element, draw, { fps = 60, onVisibilityChange } = {}) {
  let visible = false;
  let frameId = null;
  let lastFrame = null;
  let lastDraw = null;
  let disposed = false;
  let active = false;
  const interval = 1000 / fps;

  function tick(now) {
    frameId = null;
    if (!active || disposed) return;
    const elapsed = lastFrame === null ? interval : now - lastFrame;
    if (elapsed >= interval - 0.5) {
      lastFrame = elapsed < interval ? now : now - (elapsed % interval);
      const delta = lastDraw === null ? interval : now - lastDraw;
      lastDraw = now;
      draw(now, Math.min(delta / 1000, 0.05));
    }
    if (active && !disposed) frameId = requestAnimationFrame(tick);
  }

  function sync() {
    const next = visible && !document.hidden && !disposed;
    if (next !== active) {
      active = next;
      lastFrame = null;
      lastDraw = null;
      onVisibilityChange?.(active);
    }
    if (active && frameId === null) frameId = requestAnimationFrame(tick);
    if (!active && frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { threshold: 0 });
  observer.observe(element);
  document.addEventListener('visibilitychange', sync);
  return {
    dispose() {
      disposed = true;
      sync();
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    }
  };
}

/** Prepare expensive WebGL scenes shortly before they enter the viewport. */
export function initializeNearViewport(element, initialize) {
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      observer.disconnect();
      initialize();
    }
  }, { rootMargin: '600px 0px' });
  observer.observe(element);
}
