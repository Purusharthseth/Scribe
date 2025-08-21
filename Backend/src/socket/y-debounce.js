// y-debounce.js
export function createDebouncedSaver(DEBOUNCE_MS = 2000) {
  const timers = new Map(); // room -> { t: TimeoutID , fn: () =>{}}

  function schedule(room, fn) {
    let entry = timers.get(room);
    if (!entry) {
      entry = { t: null, fn: null };
      timers.set(room, entry);
    }
    entry.fn = fn;

    if (entry.t) clearTimeout(entry.t);
    entry.t = setTimeout(async () => {
      const toRun = entry.fn;
      clearTimeout(entry.t);
      entry.t = null;
      entry.fn = null;
      timers.delete(room);

      if (toRun) await toRun();
    }, DEBOUNCE_MS);
  }

  function flushImmediate(room) {
    const entry = timers.get(room);
    if (!entry || !entry.fn) return false;

    clearTimeout(entry.t);
    const toRun = entry.fn;

    entry.t = null;
    entry.fn = null;
    timers.delete(room);

    return toRun();
  }

  return { schedule, flushImmediate };
}