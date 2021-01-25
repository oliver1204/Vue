## vue 流程概括
## 编译入口
在 编译入口文件我中，我们可以看到 vue 实际上分为两个版本：

` scripts/config.js `

```js
const builds = {
  'web-runtime-cjs-dev': {
    entry: resolve('web/entry-runtime.js'),
  },
  'web-full-cjs-dev': {
    entry: resolve('web/entry-runtime-with-compiler.js'),
  },
}

```

* `/entry-runtime` 是只能通过 `vue.render` 编译， 不允许通过 `template` 方式编译，换言之，此文件比较小，剔除模版解析部分的代码。

* `entry-runtime-with-compiler` 是完整的代码，既可以使用 `vue.render` 也可以使用 `template`。

## vue 渲染流程

`/core/instance/index.js`

```js
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue

```
切片代码分割，调用 `_init`。整体流程如下：

`数据劫持 => vm.$mount() => mountComponent挂载组件 => vm._update(vm._render()) + Watcher + 收集依赖 `

```js
export function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    const vm = this;
    vm.$options = options;

    // 初始化数据， 数据劫持
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
    return mountComponent(vm, el);
  };
}
```

### $mount -- parse-html

 `vue` 在 `mount`时， 如果用户传入el需要将页面渲染出来，默认先找 `render` 方法，如果没有 `render`方法，再找 `template`，如果都没有就使用 `el`对应的 `html`。

在使用过程中，需要将 `template` 转成 `render`。

在编译过程中，vue 在匹配过程中，一旦找到需要匹配的节点后，就将其截取，例如
` <div id="app"><p>hello</p></div> `匹配`<div`成功后， 截取，变成`id="app"><p>hello</p></div>`， 依次，直到结束.


`<div id="app"><p>hello</p></div>` 通过 parseHTML 函数后变成ast 语法树，

```js
{
  type: 1,
  tag: "div",
  parent: null,
  attrsList: [{
    name: "id",
    value: "app"
  }],
  children: [
    type: 1,
    tag: "p",
    parent: {type: 1, tag: "div",attrsList: Array(1), parent: null, children: Array(1)},
    attrsList: [],
    children: [{type: 3, text: "hello"}]
  ]
}

```

### _render()

```js
  Vue.prototype._render = function () {
    const vm = this;

    const { render } = vm.$options;

    return render.call(vm, h);
  };
```

借用h方法，经过运行用户所编写的 `render`方法。 `h`方法将 其 返回的结果编译成 `虚拟DOM` 。

### _update()

```js
Vue.prototype._update = function (vNode) {
  const vm = this;
  patch(vm.$el, vNode);
};
```

```js
function patch(oldVNode, vNode) {
  const isRealElement = oldVNode.nodeType;
  if (isRealElement) { // 首次渲染
    const oldElm = oldVNode; // div id="app"
    const parentElm = oldElm.parentNode; // 父节点

    let el = createElm(vNode);
    parentElm.insertBefore(el, oldElm.nextSibling);
    parentElm.removeChild(oldElm);
  } else { // 更新
    patchVnode(oldVNode, vNode);
  }
  return vNode.el;
}

```

在 _update() 方法通过 createElm 将 `虚拟DOM` 转化为 `真实DOM` 节点。

 `patchVnode` 中进行 `DOM DIFF`算法。


### DOM DIFF

```js
function patchVnode(oldVNode, vNode) {
  if (oldVNode === vNode) {
    return;
  }
  // 1) 比较标签
  if (oldVNode.tag !== vNode.tag) {
    // 直接全部替换，不做任何比较
  }
  // 2）比较文本 
  if (!oldVNode.tag) {
   // 直接替换
  }
  // 3）更新属性：如果标签一样 属性不一样 
  let el = (vNode.el = oldVNode.el);
  updateProperties(vNode, oldVNode.data);

  // 4）比较孩子
  let oldChildren = oldVNode.children || [];
  let newChildren = vNode.children || [];

  if (oldChildren.length > 0 && newChildren.length > 0) {
    // 4.1）新老都有孩子
    // 更新孩子  DOM DIFF 核心
    updateChildren(el, oldChildren, newChildren);
  } else if (oldChildren.length > 0) {
    // 4.2) 老有孩子, 新的没有孩子 -- 置空 则可
    el.innerHTML = '';
  } else {
    // 4.3) 新有孩子, 老的没有孩子
    // 调用 createElm 创建真实dom
  }
}

function updateChildren() {
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if('老队列的头部节点 和 新队列的头部节点 一样') {
      ...
    } else if('老队列的尾部节点 和 新队列的尾部节点 一样') {
      ...
    } else if('老队列的头部节点 和 新队列的尾部节点 一样') {
      ...
      // ABCD=> DCBA, 1)BCD A 2)CD BA 3) D CBA 4)  DCBA
    }else if('老队列的尾部节点 和 新队列的头部节点 一样') {
      // ABCD => DABC 
    }else if('乱序') {
      // 从新队列的头部节点开始查询 
      if('此元素在老序列中没有找到，需要在头部插入') {
        ...
      } else {
        // 移动节点到对应的位置
      }
    }
  }

  if(newStartIdx <= newEndIdx) {
    // 添加节点
    ...
  }

  if (oldStartIdx <= oldEndIdx) {
    // 删除
    ...
  }
}
```



