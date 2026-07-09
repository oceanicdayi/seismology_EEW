const eventBus = (() => {
  const handlers = {};
  const queue = [];

  function on(event, fn) {
    if (!handlers[event]) handlers[event] = [];
    handlers[event].push(fn);
    return () => {
      const arr = handlers[event];
      if (arr) { const i = arr.indexOf(fn); if (i >= 0) arr.splice(i, 1); }
    };
  }

  function emit(event, payload) {
    queue.push({ event, payload });
    if (queue.length === 1) _process();
  }

  function _process() {
    while (queue.length) {
      const { event, payload } = queue.shift();
      const fns = handlers[event];
      if (fns) fns.forEach(fn => {
        try { fn(payload); } catch (e) { console.error('EventBus handler error:', e); }
      });
    }
  }

  return { on, emit };
})();
