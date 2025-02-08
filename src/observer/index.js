import { isObject, def } from "../util/index";
import { arrayMethods } from "./array";
import Dep from "./dep";

export function observe(value) {
  if (!isObject(value)) return; // 不是 对象或者数组

  return new Observer(value); // 观测数据
}

export class Observer {
  constructor(value) {
    this.dep = new Dep();
    /**
     * 给每一个检测过的对象都加一个__ob__属性，换句话说__ob__表示该对象已经被检测过了
     * 但是 不能用 this.__ob__ = value 这种方式，因为 observeArray 时会循环引用，所以
     * 用def定义响应式， enumerable: false不可以枚举，不会被defineReactive监控
     */
    def(value, "__ob__", this);

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
  const dep = new Dep(); // 每个属性对应一个依赖管理器
  let val = obj[key];
  // 递归观察子属性（如果 val 是对象或数组）
  let childOb = observe(val); // 关键：递归入口

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      if (Dep.target) {
        dep.depend(); // 对象的依赖收集
        if (childOb) {
          // 数组的依赖收集
          // 这里虽然对象，也会进来，但是 this.depIds = new Set()，会过滤调对象的已经保存起来的watcher
          childOb.dep.depend(); // 收集子对象的依赖（用于 $set/$delete 等场景）
          if (Array.isArray(val)) {
            dependArray(val);
          }
        }
      }
      return val;
    },
    set: function reactiveSetter(newVal) {
      console.log("数据更新");
      if (val === newVal) return;
      observe(newVal);
      val = newVal;
      // 新值可能是对象或数组，需要递归观察
      childOb = observe(newVal); // 递归处理新值
      dep.notify(); // 让watcher去更新watcher.update
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
