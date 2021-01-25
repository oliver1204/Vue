import Dep, { pushTarget, popTarget } from './dep';
import { queueWatcher } from './scheduler';

let uid = 0;

export default class Watcher {
  constructor(vm, expOrFn, cb, options) {
    this.vm = vm;
    this.cb = cb;
    this.id = ++uid;
    this.getter = expOrFn;
    this.depIds = new Set();

    this.get();
  }
  get() {
    pushTarget(this);
    this.getter();
    popTarget();
  }
  update() {
    console.log(this.vm);
    // this.get();
    queueWatcher(this); // 将watcher 放入queueWatcher中
  }
  addDep(dep) {
    // dep 和 watcher 多对多的关系
    const id = dep.id;

    if (!this.depIds.has(id)) {
      dep.addSub(this);
    }
  }
  run() {
    this.get();
  }
}
