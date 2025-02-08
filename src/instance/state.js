import { observe } from "../observer/index";
import { isPlainObject } from "../util";

function proxy(vm, source, key) {
  Object.defineProperty(vm, key, {
    get() {
      return vm[source][key];
    },
    set(newValue) {
      vm[source][key] = newValue;
    },
  });
}

export function initState(vm) {
  const opts = vm.$options;

  if (opts.props) initProps(vm, opts.props);
  if (opts.methods) initMethods(vm, opts.methods);
  if (opts.data) { 
    initData(vm);
  }
  if (opts.computed) initComputed(vm, opts.computed);
  if (opts.watch) {
    initWatch(vm, opts.watch);
  }
}

function initProps(vm) {}
function initMethods(vm) {}
function initData(vm) {
  let data = vm.$options.data;
  data = vm._data = typeof data === "function" ? data.call(vm, vm) : data || {};

  for (let key in data) {
    proxy(vm, "_data", key);
  }
  // 数据劫持
  observe(data);
}
function initComputed(vm) {
  const watchers = (vm._computedWatchers = Object.create(null));
  // 遍历 computed 选项，依次进行定义
  for (const key in computed) {
    const getter = computed[key];

    // 为计算属性创建内部 watcher
    watchers[key] = new Watcher(
      vm,
      getter || noop, // 计算属性 text 函数
      noop,
      computedWatcherOptions // { lazy: true } ，指定 lazy 属性，表示要实例化 computedWatcher
    );

    // 为计算属性定义 getter
    defineComputed(vm, key, userDef);
  }
}
function initWatch(vm, watch) {
  for (const key in watch) {
    const handler = watch[key];
    if (isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}

function createWatcher(vm, expOrFn, handler, options = {}) {
  if (isPlainObject(handler)) {
    options = handler;
    handler = handler.handler;
  }
  if (typeof handler === "string") {
    handler = vm[handler];
  }
  return vm.$watch(expOrFn, handler, options);
}

function defineComputed(target, key, userDef) {
  Object.defineProperty(target, key, {
    get: function () {
      const watcher = this._computedWatchers && this._computedWatchers[key];
      if (watcher) {
        if (watcher.dirty) {
          watcher.evaluate();
        }
        if (Dep.target) {
          watcher.depend();
        }
        return watcher.value;
      }
    },
  });
}
