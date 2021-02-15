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
    if (typeof target[key] === 'object' && target[key] != null) {
      return new Proxy(target[key], handle);
    }
    // return target[key]

    return Reflect.get(target, key, receiver);
  },
  set: (target, key, newValue, receiver) => {
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
