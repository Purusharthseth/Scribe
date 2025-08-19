export function createDocSaver() {
  const timers = new Map(); 
  const DEBOUNCE_MS = 2000;

  return function schedule(room, fn) {
    let entry = timers.get(room);
    if (!entry) { entry = { dirty: false, t: null }; timers.set(room, entry); }
    entry.dirty = true;
    if (entry.t) return;
    entry.t = setTimeout(async () => {
      try {
        if (!entry.dirty) return;
        entry.dirty = false;
        await fn();
      } finally {
        clearTimeout(entry.t);
        entry.t = null;
      }
    }, DEBOUNCE_MS);
  };
}