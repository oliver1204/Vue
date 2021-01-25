let queue = [];
let has = {}; // new Set() 会更好
export function queueWatcher(watcher) {
  const id = watcher.id;

  if (has[id] == null) {
    has[id] = true;
    queue.push(watcher);

    // nextTick(flushSchedulerQueue)
    setTimeout(() => {
      queue.forEach((watcher) => watcher.run());
      queue = [];
      has = {};
    }, 0);
  }
}
