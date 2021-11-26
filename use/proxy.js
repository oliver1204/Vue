let data = {
  obj: {
    lazy: true,
  },
  name: 'vue2',
};

let handle = {
  get: (target, key, receiver) => {
    console.log('收集依赖');
    // 懒代理: 只有取到对应值的时候才代理
    // Proxy只会代理对象的第一层，那么Vue3又是怎样处理这个问题的呢？
    /**
     * 判断当前Reflect.get的返回值是否为Object，如果是则再通过reactive方法做代理， 这样就实现了深度观测。
     */
    if (typeof target[key] === 'object' && target[key] != null) {
      return new Proxy(target[key], handle);
    }
    // return target[key]

    return Reflect.get(target, key, receiver);
  },
  set: (target, key, newValue, receiver) => {
    /**
     * 监测数组的时候可能触发多次get/set，那么如何防止触发多次呢？
     * 我们可以判断key是否为当前被代理对象target自身属性，也可以判断旧值与新值是否相等，只有满足以上两个条件之一时，才有可能执行trigger。
     */
    let oldValue = target[key];
    if (!oldValue) {
      console.log('检测到：新增属性');
    } else {
      console.log('检测到：update属性');
    }
    console.log('通知');
    // target[key] = newValue 老写法
    return Reflect.set(target, key, newValue, receiver);
  },
};

let proxy = new Proxy(data, handle);

proxy.name = 'vue3';
