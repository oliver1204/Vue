function sameVnode(a, b) {
  return a.key === b.key && a.tag === b.tag;
}

export function patch(oldVNode, vNode) {
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
  }
  // 1) 现比较标签一不一样 div 变 p
  if (oldVNode.tag !== vNode.tag) {
    // 替换儿子，必须通过父亲
    oldVNode.el.parentNode.replaceChild(createElm(vNode), oldVNode.el);
  }
  // 2）比较文本 标签一样可能是都是undefined
  if (!oldVNode.tag) {
    if (oldVNode.text !== vNode.text) {
      // 内容不一致，直接替换文本
      oldVNode.el.textContent = vNode.text;
    }
  }
  // 3）如果标签一样 属性不一样
  let el = (vNode.el = oldVNode.el);
  updateProperties(vNode, oldVNode.data);

  // 4）比较孩子
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
      patchVnode(oldStartVnode, newEndVnode);
      // 将老队列的头部节点，插入到 老队列的尾部节点后面（每次都是插入到老队列的尾部节点）
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
          patchVnode(oldVNodeToMove, newStartVnode);
          // 移动后设置为空
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
}

// 把虚拟 dom 变成真实dom
export function createElm(vNode) {
  const { children, tag, data, key, text } = vNode;

  // 标签
  if (typeof tag === 'string') {
    vNode.el = document.createElement(tag);
    updateProperties(vNode);
    // 递归创建子节点
    if (Array.isArray(children)) {
      children.forEach((child) => vNode.el.appendChild(createElm(child)));
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
