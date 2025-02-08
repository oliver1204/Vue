import { createElement, createTextNode } from '../vdom/create-element';
import { h } from '../vdom/create-element';
export function renderMixin(Vue) {
  /**
   * 创建元素的虚拟节点
   */
  Vue.prototype._c = function () {
    return createElement(...arguments);
  };
  /**
   * 创建文本的虚拟节点
   */
  Vue.prototype._v = function (text) {
    return createTextNode(text);
  };
  /**
   * json.stringify
   */
  Vue.prototype._s = function (value) {
    return value == null
      ? ''
      : typeof value === 'object'
      ? JSON.stringify(value)
      : value;
  };
  // 调用 Vue 上的 render 方法，生成虚拟节点
  Vue.prototype._render = function () {
    const vm = this;

    const { render } = vm.$options;

    return render.call(vm, h);
  };
}

export function initRender(vm) {
  console.log(vm);
}
