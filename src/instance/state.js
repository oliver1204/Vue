import { observe } from '../observer/index';

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
  data = vm._data = typeof data === 'function' ? data.call(vm, vm) : data || {};

  for (let key in data) {
    proxy(vm, '_data', key);
  }
  // 数据劫持
  observe(data);
}
function initComputed(vm) {}
function initWatch(vm) {}
