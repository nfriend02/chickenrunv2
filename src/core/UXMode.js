/**
 * Single source of truth for the screen profile:
 *   'desktop' | 'mobile-landscape' | 'mobile-portrait'
 * It is written to <body data-ux data-orientation data-device> (CSS hooks) and pushed to subscribers,
 * so every screen, including the running game, switches layout the moment the device rotates.
 */
const MOBILE_MAX_SHORT_SIDE = 540;

function viewportSize() {
  return { width: window.innerWidth, height: window.innerHeight };
}

function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches
    || (navigator.maxTouchPoints > 0 && window.matchMedia('(hover: none)').matches);
}

function detect() {
  const { width, height } = viewportSize();
  const orientation = height > width ? 'portrait' : 'landscape';
  // Small desktop windows get the phone layout too, so a narrow browser window still reads well.
  const device = isTouchDevice() || Math.min(width, height) < MOBILE_MAX_SHORT_SIDE ? 'mobile' : 'desktop';
  const ux = device === 'desktop' ? 'desktop' : `mobile-${orientation}`;
  return { ux, device, orientation, width, height };
}

class UXMode {
  constructor() {
    this.listeners = new Set();
    this.state = null;
    this.frame = 0;
    this.refresh();

    const schedule = () => this.schedule();
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', () => {
      schedule();
      // Some mobile browsers report the old size during orientationchange; check again once it settles.
      setTimeout(schedule, 250);
    });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', schedule);
    window.matchMedia('(orientation: portrait)').addEventListener?.('change', schedule);
    window.matchMedia('(pointer: coarse)').addEventListener?.('change', schedule);
  }

  get() {
    return this.state;
  }

  is(ux) {
    return this.state.ux === ux;
  }

  /** fn(state, previous) runs now and after every size or profile change. */
  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.state, null);
    return () => this.listeners.delete(fn);
  }

  schedule() {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.refresh());
  }

  refresh() {
    const prev = this.state;
    const next = detect();
    if (prev && prev.ux === next.ux && prev.width === next.width && prev.height === next.height) return;
    this.state = next;

    const body = document.body;
    body.dataset.ux = next.ux;
    body.dataset.device = next.device;
    body.dataset.orientation = next.orientation;
    document.documentElement.style.setProperty('--app-h', `${next.height}px`);
    document.documentElement.style.setProperty('--app-w', `${next.width}px`);

    this.listeners.forEach(fn => fn(next, prev));
  }
}

export const uxMode = new UXMode();
window.__UX__ = uxMode;
