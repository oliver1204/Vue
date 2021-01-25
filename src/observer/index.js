import { isObject, def } from '../util/index';
import { arrayMethods } from './array';
import Dep from './dep';

export function observe(value) {
  if (!isObject(value)) return;

  return new Observer(value); // 观测数据
}

export class Observer {
  constructor(value) {
    this.dep = new Dep();
    /**
     * 给每一个检测过的对象都加一个__ob__属性，换句话说__ob__表示该对象已经被检测过了
     * 但是 不能用 this.value = value 这种方式，因为 observeArray 时会循环引用，所以
     * 用def定义响应式， enumerable: false不可以枚举，不会被defineReactive监控
     */
    def(value, '__ob__', this);

    if (Array.isArray(value)) {
      // 利用原型链的方式对数组的'push'、'pop'、'shift'、'unshift'、'splice'、'sort'、'reverse'方法进行重写
      // 先找重写的，没有再去找原生的
      value.__proto__ = arrayMethods;

      this.observeArray(value);
    } else {
      this.walk(value);
    }
  }

  walk(obj) {
    const keys = Object.keys(obj);
    keys.forEach((key) => {
      // 定义响应式数据
      defineReactive(obj, key, obj[key]);
    });
  }
  observeArray(items) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i]);
    }
  }
}

export function defineReactive(obj, key, val) {
  const dep = new Dep();
  let childOb = observe(val);

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      if (Dep.target) {
        dep.depend(); // 对象的依赖收集
        if (childOb) {
          // 数组的依赖收集
          // 这里虽然对象，也会进来，但是 this.depIds = new Set()，会过滤调对象的已经保存起来的watcher
          childOb.dep.depend();
          if (Array.isArray(val)) {
            dependArray(val);
          }
        }
      }
      return val;
    },
    set: function reactiveSetter(newVal) {
      console.log('数据更新');
      if (val === newVal) return;
      observe(newVal);
      val = newVal;
      dep.notify();
    },
  });
}

function dependArray(value) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i];
    e && e.__ob__ && e.__ob__.dep.depend();
    if (Array.isArray(e)) {
      dependArray(e);
    }
  }
}
