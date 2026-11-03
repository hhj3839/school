/** One finger owns a gesture until it ends or the page interrupts it. */
export function createPointerGesture(onStop: () => void) {
  let active: number | null = null;
  return {
    begin(id: number) {
      if (active !== null) return false;
      active = id;
      return true;
    },
    owns(id: number) { return active === id; },
    end(id: number) {
      if (active !== id) return;
      active = null;
      onStop();
    },
    reset() { active = null; onStop(); },
  };
}

/** Also reset on teardown, so an unmounted control cannot keep moving. */
export function bindInputInterruptions(reset: () => void, view: EventTarget, page: EventTarget) {
  view.addEventListener('blur', reset);
  view.addEventListener('pagehide', reset);
  page.addEventListener('visibilitychange', reset);
  return () => {
    view.removeEventListener('blur', reset);
    view.removeEventListener('pagehide', reset);
    page.removeEventListener('visibilitychange', reset);
    reset();
  };
}
