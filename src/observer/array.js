/**
 * 重写数组的7个方法
 * 'push'、'pop'、'shift'、'unshift'、'splice'、'sort'、'reverse'
 * 这7个方法会导致数组本身发生改变
 * slice 这种不会导致数组本身变化的不作处理
 */
const arrayProto = Array.prototype;
export const arrayMethods = Object.create(arrayProto);

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
];

methodsToPatch.forEach((method) => {
  const original = arrayProto[method];

  arrayMethods[method] = function (...args) {
    const result = original.apply(this, args); // 调用原生数组的方法
    const ob = this.__ob__; // Observer 实例
    let inserted; // 插入的元素 例如，arr.push(a), inserted = a
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break;
      case 'splice': // 有三个参数，删除|新增 arr.splice(0, 1 , {name: 1})
        inserted = args.slice(2);
        break;
    }
    /**
     * observe新添加的数据
     */
    if (inserted) ob.observeArray(inserted);
    ob.dep.notify();
    return result;
  };
});
