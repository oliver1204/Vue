(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

  function isObject(obj) {
    return obj !== null && typeof obj === 'object';
  }
  function def(obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
      value: val,
      enumerable: !!enumerable,
      writable: true,
      configurable: true
    });
  }

  /**
   * 重写数组的7个方法
   * 'push'、'pop'、'shift'、'unshift'、'splice'、'sort'、'reverse'
   * 这7个方法会导致数组本身发生改变
   * slice 这种不会导致数组本身变化的不作处理
   */
  const arrayProto = Array.prototype;
  const arrayMethods = Object.create(arrayProto);
  const methodsToPatch = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
  methodsToPatch.forEach(method => {
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

        case 'splice':
          // 有三个参数，删除|新增 arr.splice(0, 1 , {name: 1})
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
      // 将watcher收集起来
      if (Dep.target) {
        Dep.target.addDep(this);
      }
    }

    notify() {
      const subs = this.subs.slice();

      for (let i = 0, l = subs.length; i < l; i++) {
        subs[i].update();
      }
    }

  }

  Dep.target = null;
  const targetStack = [];
  function pushTarget(watcher) {
    targetStack.push(watcher);
    Dep.target = watcher;
  }
  function popTarget() {
    targetStack.pop();
    Dep.target = targetStack[targetStack.length - 1];
  }

  function observe(value) {
    if (!isObject(value)) return;
    return new Observer(value); // 观测数据
  }
  class Observer {
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
      keys.forEach(key => {
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
  function defineReactive(obj, key, val) {
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
      }
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

  function proxy(vm, source, key) {
    Object.defineProperty(vm, key, {
      get() {
        return vm[source][key];
      },

      set(newValue) {
        vm[source][key] = newValue;
      }

    });
  }

  function initState(vm) {
    const opts = vm.$options;
    if (opts.props) initProps(vm, opts.props);
    if (opts.methods) initMethods(vm, opts.methods);

    if (opts.data) {
      initData(vm);
    }

    if (opts.computed) initComputed(vm, opts.computed);

    if (opts.watch) {
      initWatch(vm, opts.watch);
    }
  }

  function initProps(vm) {}

  function initMethods(vm) {}

  function initData(vm) {
    let data = vm.$options.data;
    data = vm._data = typeof data === 'function' ? data.call(vm, vm) : data || {};

    for (let key in data) {
      proxy(vm, '_data', key);
    } // 数据劫持


    observe(data);
  }

  function initComputed(vm) {}

  function initWatch(vm) {}

  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // aa-aaa

  const qnameCapture = `((?:${ncname}\\:)?${ncname})`; // <aaa:abcd>

  const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则，捕获的内容是标签内容

  const startTagClose = /^\s*(\/?)>/; // 匹配结束标签>

  const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签的结尾的 </div>

  const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性

  const doctype = /^<!DOCTYPE [^>]+>/i;
  const comment = /^<!\--/;
  function parseHTML(html, options) {
    let root = null;
    let currentParent = null;
    let stack = []; // ['div', 'p', 'span', 'span', 'p', 'div',]

    function createASTElement(tag, attrs) {
      return {
        type: 1,
        tag,
        attrsList: attrs,
        parent: null,
        children: []
      };
    }

    function start(tag, attrs) {
      let element = createASTElement(tag, attrs);

      if (!root) {
        root = element;
      }

      currentParent = element;
      stack.push(element);
    }

    function chars(text) {
      text = text.replace(/\s/g, '');

      if (text) {
        currentParent.children.push({
          type: 3,
          text
        });
      }
    }

    function end() {
      const element = stack.pop();
      currentParent = stack[stack.length - 1];
      /**
       * parent,children 只能在end的时候确定，不能在start时确认
       * 只有在end时，才知道时否时闭合标签
       */

      if (currentParent) {
        element.parent = currentParent;
        currentParent.children.push(element);
      }
    }

    while (html) {
      let testEnd = html.indexOf('<'); // Start tag: 即，< 处在开始位置

      if (testEnd === 0) {
        let startTagMatch = parseStartTag(); // 获得 tagName,attrs

        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
          continue;
        }
      }

      let text;

      if (testEnd >= 0) {
        text = html.substring(0, testEnd);
      }

      if (text) {
        advance(text.length);
        chars(text);
      } // End tag:


      const endTagMatch = html.match(endTag);

      if (endTagMatch) {
        advance(endTagMatch[0].length);
        end(endTagMatch[1]);
        continue;
      } // Doctype:


      const doctypeMatch = html.match(doctype);

      if (doctypeMatch) {
        advance(doctypeMatch[0].length);
        continue;
      } // Comment:


      if (comment.test(html)) {
        const commentEnd = html.indexOf('-->');

        if (commentEnd >= 0) {
          if (options.shouldKeepComment) {
            options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3);
          }

          advance(commentEnd + 3);
          continue;
        }
      }
    } // 截取

    /**
     * vue 在匹配过程中，一旦找到该节点后，就将其截取调
     *  <div id="app"><p>hello</p></div>
     * 匹配`<div`成功后， 截取，变成
     * id="app"><p>hello</p></div>， 依次，直到结束
     */


    function advance(n) {
      html = html.substring(n);
    }

    function parseStartTag() {
      const start = html.match(startTagOpen);

      if (start) {
        const match = {
          tagName: start[1],
          attrs: []
        };
        advance(start[0].length);
        let end, attr; // 结束标签> 不存在，并且有属性

        while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
          advance(attr[0].length);
          match.attrs.push({
            name: attr[1],
            value: attr[3] || attr[4] || attr[5] || ''
          });
        }

        if (end) {
          advance(end[0].length);
          return match;
        }
      }
    }

    return root;
  }

  const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
  /**
   * 字符拼接称 _c('div', {background: red}, _C(), _c())
   */

  function generate(ast) {
    const code = ast ? genElement(ast) : '_c("div")';
    return code;
  }
  function genElement(el) {
    let code = `_c(
    '${el.tag}', 
    ${el.attrsList.length ? genProps(el.attrsList) : 'undefined'},
    ${genChildren(el.children)}
  )`;
    return code;
  }
  /**
   * 处理属性，拼接成属性的字符串
   */

  function genProps(attrs) {
    let str = '';
    attrs.forEach(item => {
      if (item.name === 'style') {
        let obj = {}; // style="color: red" => style: {"color: red"}

        item.value.split(';').forEach(c => {
          let [key, value] = c.split(':');
          obj[key] = value.replace(/\s/g, '');
        });
        item.value = obj;
      } // if(item.name === 'className') ....


      str += `${item.name}:${JSON.stringify(item.value)},`;
    });
    return `{${str.slice(0, -1)}}`;
  }

  function genChildren(children) {
    if (children && children.length) {
      return children.map(child => gen(child)).join(',');
    } else {
      return false;
    }
  }

  function gen(node) {
    // 元素
    if (node.type === 1) return generate(node); // 文本
    // 正则的 lastIndex https://zhuanlan.zhihu.com/p/147665861

    let text = node.text; // hello, {{message}}, hello

    let tokens = [];
    let match, index;
    let lastIndex = defaultTagRE.lastIndex = 0;

    while (match = defaultTagRE.exec(text)) {
      index = match.index; // push text token

      if (index > lastIndex) {
        tokens.push(JSON.stringify(text.slice(lastIndex, index)));
      } // tag token


      tokens.push(`_s(${match[1].trim()})`);
      lastIndex = index + match[0].length;
    }

    if (lastIndex < text.length) {
      tokens.push(JSON.stringify(text.slice(lastIndex)));
    }

    return `_v(${tokens.join('+')})`;
  }

  // vue 模版编译靠的是正则
  function compileToFunctions(template) {
    // 1)html => ast 语法树
    let ast = parseHTML(template); // 2)ast => render，即模版引擎的实现（本质字符串拼接）如下：
    // <div id="app"><p>hello{{message}}</div>
    // _c('div', {id: add}), _c('p', undefine, _v('hello' + _s('message'), _c(), _c()...))

    let code = generate(ast); // 3) 创建 render Function

    let renderFunction = new Function(`
    with(this) { 
      return ${code}
    }
  `);
    return renderFunction;
  }

  let queue = [];
  let has = {}; // new Set() 会更好

  function queueWatcher(watcher) {
    const id = watcher.id;

    if (has[id] == null) {
      has[id] = true;
      queue.push(watcher); // nextTick(flushSchedulerQueue)

      setTimeout(() => {
        queue.forEach(watcher => watcher.run());
        queue = [];
        has = {};
      }, 0);
    }
  }

  let uid$1 = 0;
  class Watcher {
    constructor(vm, expOrFn, cb, options) {
      this.vm = vm;
      this.cb = cb;
      this.id = ++uid$1;
      this.getter = expOrFn;
      this.depIds = new Set();
      this.get();
    }

    get() {
      pushTarget(this);
      this.getter();
      popTarget();
    }

    update() {
      console.log(this.vm); // this.get();

      queueWatcher(this); // 将watcher 放入queueWatcher中
    }

    addDep(dep) {
      // dep 和 watcher 多对多的关系
      const id = dep.id;

      if (!this.depIds.has(id)) {
        dep.addSub(this);
      }
    }

    run() {
      this.get();
    }

  }

  function sameVnode(a, b) {
    return a.key === b.key && a.tag === b.tag;
  }

  function patch(oldVNode, vNode) {
    const isRealElement = oldVNode.nodeType;

    if (isRealElement) {
      // 首次渲染  mounting to a real element
      const oldElm = oldVNode; // div id="app"

      const parentElm = oldElm.parentNode; // 父节点

      let el = createElm(vNode);
      parentElm.insertBefore(el, oldElm.nextSibling);
      parentElm.removeChild(oldElm);
    } else {
      // 更新
      patchVnode(oldVNode, vNode);
    }

    return vNode.el;
  }

  function patchVnode(oldVNode, vNode) {
    if (oldVNode === vNode) {
      return;
    } // 1) 现比较标签一不一样 div 变 p


    if (oldVNode.tag !== vNode.tag) {
      // 替换儿子，必须通过父亲
      oldVNode.el.parentNode.replaceChild(createElm(vNode), oldVNode.el);
    } // 2）比较文本 标签一样可能是都是undefined


    if (!oldVNode.tag) {
      if (oldVNode.text !== vNode.text) {
        // 内容不一致，直接替换文本
        oldVNode.el.textContent = vNode.text;
      }
    } // 3）如果标签一样 属性不一样


    let el = vNode.el = oldVNode.el;
    updateProperties(vNode, oldVNode.data); // 4）比较孩子

    let oldChildren = oldVNode.children || [];
    let newChildren = vNode.children || [];

    if (oldChildren.length > 0 && newChildren.length > 0) {
      // 4.1）新老都有孩子
      updateChildren(el, oldChildren, newChildren);
    } else if (oldChildren.length > 0) {
      // 4.2) 老有孩子, 新的没有孩子
      el.innerHTML = '';
    } else {
      // 4.3) 新有孩子, 老的没有孩子
      for (let i = 0; i < newChildren.length; i++) {
        let child = newChildren[i];
        el.appendChild(createElm(child));
      }
    }
  }
  /**
   * vue 增加了许多优化策略，
   * 在浏览器中，最常用的方法有 1）开头结尾插入 2）正序倒序
   *
   * vue 的 domDiff 利用了双指针
   */


  function updateChildren(parentElm, oldCh, newCh) {
    let oldStartIdx = 0;
    let oldEndIdx = oldCh.length - 1;
    let oldStartVnode = oldCh[0];
    let oldEndVnode = oldCh[oldEndIdx];
    let newStartIdx = 0;
    let newEndIdx = newCh.length - 1;
    let newStartVnode = newCh[0];
    let newEndVnode = newCh[newEndIdx];
    let oldKeyToIdxMap, oldIndexByKey;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (!oldStartVnode) {
        oldStartVnode = oldCh[++oldStartIdx];
      } else if (!oldEndVnode) {
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        // 老队列的头部节点 和 新队列的头部节点 一样
        patchVnode(oldStartVnode, newStartVnode);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        // 老队列的尾部节点 和 新队列的尾部节点 一样
        patchVnode(oldEndVnode, newEndVnode);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newEndVnode)) {
        // 老队列的头部节点 和 新队列的尾部节点 一样
        patchVnode(oldStartVnode, newEndVnode); // 将老队列的头部节点，插入到 老队列的尾部节点后面（每次都是插入到老队列的尾部节点）
        // ABCD=> DCBA, 1)BCD A 2)CD BA 3) D CBA 4)  DCBA

        parentElm.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) {
        // 老队列的尾部节点 和 新队列的头部节点 一样
        // ABCD => DABC
        patchVnode(oldEndVnode, newStartVnode);
        parentElm.insertBefore(oldEndVnode.el, oldStartVnode.el);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else {
        // 乱序
        oldKeyToIdxMap = createKeyToOldIdx(oldCh);
        oldIndexByKey = oldKeyToIdxMap[newStartVnode.key];

        if (oldIndexByKey == null) {
          // 此元素在老序列中没有找到，需要在头部插入
          parentElm.insertBefore(createElm(newStartVnode), oldStartVnode.el);
        } else {
          let oldVNodeToMove = oldCh[oldIndexByKey];

          if (oldVNodeToMove.tag !== newStartVnode.tag) {
            parentElm.insertBefore(createElm(newStartVnode));
          } else {
            // 移动
            patchVnode(oldVNodeToMove, newStartVnode); // 移动后设置为空

            oldCh[oldIndexByKey] = undefined;
            parentElm.insertBefore(oldVNodeToMove.el, oldStartVnode.el);
          }
        }

        newStartVnode = newCh[++newStartIdx];
      }
    }

    if (newStartIdx <= newEndIdx) {
      // 添加节点
      // insertBefore(el1, el2), 如果将要插入的节点， el2 = null, 等价与 appendChild
      // el: 我要把这个节点插入到谁的前面
      let ele = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].el;

      for (let i = newStartIdx; i <= newEndIdx; i++) {
        parentElm.insertBefore(createElm(newCh[i]), ele);
      }
    }

    if (oldStartIdx <= oldEndIdx) {
      // 删除
      for (let i = oldStartIdx; i <= oldEndIdx; i++) {
        if (oldCh[i] != undefined) {
          parentElm.removeChild(oldCh[i].el);
        }
      }
    }
  }

  function createKeyToOldIdx(children) {
    const map = {};

    for (let i = 0; i <= children.length; i++) {
      let key = children[i] && children[i].key;
      if (key) map[key] = i;
    }

    return map;
  } // 把虚拟 dom 变成真实dom


  function createElm(vNode) {
    const {
      children,
      tag,
      data,
      key,
      text
    } = vNode; // 标签

    if (typeof tag === 'string') {
      vNode.el = document.createElement(tag);
      updateProperties(vNode); // 递归创建子节点

      if (Array.isArray(children)) {
        children.forEach(child => vNode.el.appendChild(createElm(child)));
      }
    } else {
      vNode.el = document.createTextNode(text);
    }

    return vNode.el;
  }
  /**
   * 更新属性
   */

  function updateProperties(vNode, oldProps = {}) {
    const newProps = vNode.data || {};
    const el = vNode.el;
    const newStyle = newProps.style || [];
    const oldStyle = oldProps.style || [];

    for (let styleName in oldStyle) {
      if (!newStyle[styleName]) {
        el.style[styleName] = '';
      }
    }

    for (let key in oldProps) {
      if (!newProps[key]) {
        delete el[key];
      }
    }

    for (let key in newProps) {
      if (key === 'style') {
        for (let styleName in newProps.style) {
          el.style[styleName] = newProps.style[styleName];
        }
      } else if (key === 'class') {
        el.class = newProps.className;
      } else {
        el.setAttribute(key, newProps[key]);
      }
    }
  }

  /**
   * vnode 渲染成为真实的节点
   */

  function lifecycleMixin(Vue) {
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
  function mountComponent(vm, el) {
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


    new Watcher(vm, updateComponent, () => {}, true
    /* isRenderWatcher */
    );
    return vm;
  }

  /**
   * createElement, createTextNode 是用来实现虚拟节点的
   * template => ast => render => vnode => real node
   */
  function h(tag, data = {}, ...children) {
    children = children.map(child => typeof child == 'string' || typeof child == 'number' ? createTextNode(child) : child);
    return createElement(tag, data, ...children);
  }
  function createElement(tag, data = {}, ...children) {
    let key = data.key;
    if (key) delete data.key;
    return vnode(tag, data, key, children, undefined);
  }
  function createTextNode(text) {
    return vnode(undefined, undefined, undefined, undefined, text);
  }
  function vnode(tag, data, key, children, text, el) {
    return {
      _type: 'VNODE_TYPE',
      tag,
      data,
      key,
      children,
      text,
      el // 真实节点

    };
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      const vm = this;
      vm.$options = options; // 初始化数据

      initState(vm); // 如果用户传入el需要将页面渲染出来

      if (vm.$options.el) {
        vm.$mount(vm.$options.el);
      }
    };

    Vue.prototype.$mount = function (el) {
      const vm = this;
      const options = vm.$options;

      if (typeof el == 'string') {
        el = document.querySelector(el);
      } // 默认先找render方法，在找template，如果都没有就使用el
      // 1) 首先 把 模版转成 render函数


      if (!options.render) {
        let template = options.template;

        if (!template && el) {
          template = getOuterHTML(el);
        } // 我们需要将template转成render ，以便 虚拟dom使用


        let render = compileToFunctions(template);
        options.render = render;
      } else {
        let render = options.render;

        options.render = () => render(h);
      } // 2）挂载组件


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

  function renderMixin(Vue) {
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
      return value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : value;
    }; // 调用 Vue 上的 render 方法，生成虚拟节点


    Vue.prototype._render = function () {
      const vm = this;
      const {
        render
      } = vm.$options;
      return render.call(vm, h);
    };
  }

  function Vue(options) {
    this._init(options);
  }

  initMixin(Vue);
  renderMixin(Vue);
  lifecycleMixin(Vue);

  return Vue;

})));
//# sourceMappingURL=bundle.js.map
