let uid = 0;

class Dep {
  constructor() {
    this.id = uid++;
    this.subs = [];
  }

  addSub(sub) {
    this.subs.push(sub); // 观察者模式
  }

  removeSub(sub) {
    remove(this.subs, sub);
  }

  depend() {
    // 将当前检测的watcher收集起来
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }

  notify() {
    const subs = this.subs.slice();
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update(); // watcher.update()
    }
  }
}

Dep.target = null; // 全局变量，检测当前正在检测的watcher
const targetStack = [];

export function pushTarget(watcher) {
  targetStack.push(watcher);
  Dep.target = watcher;
}

export function popTarget() {
  targetStack.pop();
  Dep.target = targetStack[targetStack.length - 1];
}

export default Dep;
