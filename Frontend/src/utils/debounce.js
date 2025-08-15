const debounce = (fn, delay) => {
  const timers = new Map();

  return (key, ...args) => {
    if (timers.has(key)) {
      clearTimeout(timers.get(key));
    }

    const timer = setTimeout(async () => {
      try {
        await fn(key, ...args);
      } finally {
        timers.delete(key); 
      }
    }, delay);

    timers.set(key, timer);
  };
};

export default debounce;
