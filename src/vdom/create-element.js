/**
 * createElement, createTextNode 是用来实现虚拟节点的
 * template => ast => render => vnode => real node
 */
export function h(tag, data = {}, ...children) {
  children = children.map((child) =>
    typeof child == 'string' || typeof child == 'number'
      ? createTextNode(child)
      : child
  );

  return createElement(tag, data, ...children);

  // if (tag) {
  //   if (typeof children[0] == 'string' || typeof children[0] == 'number') {
  //     children[0] = createTextNode(children[0]);
  //   }
  //   vnode = createElement(tag, data, ...children);
  // }
  // return vnode;
}
export function createElement(tag, data = {}, ...children) {
  let key = data.key;
  if (key) delete data.key;
  return vnode(tag, data, key, children, undefined);
}

export function createTextNode(text) {
  return vnode(undefined, undefined, undefined, undefined, text);
}

export function vnode(tag, data, key, children, text, el) {
  return {
    _type: 'VNODE_TYPE',
    tag,
    data,
    key,
    children,
    text,
    el, // 真实节点
  };
}
