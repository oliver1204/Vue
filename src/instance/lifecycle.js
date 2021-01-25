import Watcher from '../observer/watcher';
import { patch, createElm } from '../vdom/patch';
/**
 * vnode 渲染成为真实的节点
 */
export function lifecycleMixin(Vue) {
  Vue.prototype._update = function (vNode) {
    const vm = this;
    const el = vm.$el; // 真实节点
    const prevVNode = vm._vNode; // 上一次的虚拟节点
    if (!prevVNode) {
      // 首次挂载
      vm._vNode = vNode;
      patch(el, vNode);
    } else {
      // 更新
      vm.$el = patch(prevVNode, vNode);
    }

    return;
  };
}

export function callHook(vm, hook) {
  const handlers = vm.$options[hook];
  if (handlers) {
    for (let i = 0, l = handlers.length; i < l; i++) {
      return handlers[i];
    }
  }
}

export function mountComponent(vm, el) {
  const options = vm.$options;
  vm.$el = el; // 挂载后，$el 就保存了真实dom节点信息

  // callHook(vm, 'beforeMount')
  /**
   * 1）渲染
   * 核心之一， 先render后update, 无论是更新还是创建都需要这个函数
   * _render 调用 Vue 上的 render 方法，生成虚拟节点
   * _update 通过 vnode, 创建真实的节点
   */

  let updateComponent = () => {
    vm._update(vm._render());
  };
  /**
   * 2）渲染 Watcher， 每一个组建都有一个 Watcher
   */
  new Watcher(vm, updateComponent, () => {}, true /* isRenderWatcher */);
  return vm;
}
