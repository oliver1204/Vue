import { initState } from './state';
import { compileToFunctions } from '../compiler/index';
import { mountComponent } from './lifecycle';
import { h } from '../vdom/create-element';

export function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    const vm = this;
    vm.$options = options;

    // 初始化数据
    initState(vm);

    // 如果用户传入el需要将页面渲染出来
    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
  Vue.prototype.$mount = function (el) {
    const vm = this;
    const options = vm.$options;
    if (typeof el == 'string') {
      el = document.querySelector(el);
    }

    // 默认先找render方法，在找template，如果都没有就使用el
    // 1) 首先 把 模版转成 render函数
    if (!options.render) {
      let template = options.template;
      if (!template && el) {
        template = getOuterHTML(el);
      }
      // 我们需要将template转成render ，以便 虚拟dom使用
      let render = compileToFunctions(template);
      options.render = render;
    } else {
      let render = options.render;
      options.render = () => render(h);
    }
    // 2）挂载组件
    console.log(options);
    return mountComponent(vm, el);
  };
}

function getOuterHTML(el) {
  if (el.outerHTML) {
    return el.outerHTML;
  } else {
    const container = document.createElement('div');
    container.appendChild(el.cloneNode(true));
    return container.innerHTML;
  }
}
