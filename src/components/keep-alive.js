import { isRegExp, remove } from "../util";
import { getFirstComponentChild } from "core/vdom/helpers/index";
import { getComponentName } from "../vdom/create-component";

function _getComponentName(opts) {
  return opts && (getComponentName(opts.Ctor.options) || opts.tag);
}

function matches(pattern, name) {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1;
  } else if (typeof pattern === "string") {
    return pattern.split(",").indexOf(name) > -1;
  } else if (isRegExp(pattern)) {
    return pattern.test(name);
  }
  /* istanbul ignore next */
  return false;
}

function pruneCache(keepAliveInstance, filter) {
  const { cache, keys, _vnode } = keepAliveInstance;
  for (const key in cache) {
    const entry = cache[key];
    if (entry) {
      const name = entry.name;
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode);
      }
    }
  }
}

function pruneCacheEntry(cache, key, keys, current) {
  const entry = cache[key];
  if (entry && (!current || entry.tag !== current.tag)) {
    entry.componentInstance.$destroy();
  }
  cache[key] = null;
  remove(keys, key);
}

const patternTypes = [String, RegExp, Array];

// TODO defineComponent
export default {
  name: "keep-alive",
  abstract: true, // 不会触发lifecycle

  props: {
    include: patternTypes, // 白名单
    exclude: patternTypes, // 黑名单
    max: [String, Number], // 最大组件数
  },

  methods: {
    cacheVNode() {
      const { cache, keys, vnodeToCache, keyToCache } = this;
      if (vnodeToCache) {
        const { tag, componentInstance, componentOptions } = vnodeToCache;
        cache[keyToCache] = {
          name: _getComponentName(componentOptions),
          tag,
          componentInstance,
        };
        keys.push(keyToCache);
        // prune oldest entry
        if (this.max && keys.length > parseInt(this.max)) {
          // 如果缓存的组件达到上线，则删除掉最早push进数组的那个组件， 及this.key 的第一个项
          pruneCacheEntry(cache, keys[0], keys, this._vnode);
        }
        this.vnodeToCache = null;
      }
    },
  },

  created() {
    this.cache = Object.create(null); // 换成列表
    this.keys = []; // 缓存的key列表， 缓存的组件的el, vnode
  },

  destroyed() {
    for (const key in this.cache) {
      // keep-alive销毁时，删除所有的缓存
      pruneCacheEntry(this.cache, key, this.keys);
    }
  },

  mounted() {
    // 监控缓存列表
    this.cacheVNode();
    this.$watch("include", (val) => {
      pruneCache(this, (name) => matches(val, name));
    });
    this.$watch("exclude", (val) => {
      pruneCache(this, (name) => !matches(val, name));
    });
  },

  updated() {
    this.cacheVNode();
  },

  render() {
    const slot = this.$slots.default; // 获取默认插槽
    const vnode = getFirstComponentChild(slot); // 获取第一个组件
    const componentOptions = vnode && vnode.componentOptions;
    if (componentOptions) {
      // check pattern
      const name = _getComponentName(componentOptions); // 获取组件名称，看是否需要缓存
      const { include, exclude } = this;
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode; // 不需要缓存
      }

      const { cache, keys } = this;
      const key =
        vnode.key == null
          ? // same constructor may get registered as different local components
            // so cid alone is not enough (#3269)
            componentOptions.Ctor.cid +
            (componentOptions.tag ? `::${componentOptions.tag}` : "")
          : vnode.key; // 生成缓存key
      if (cache[key]) {
        // 如果组件实力存在则直接复用
        vnode.componentInstance = cache[key].componentInstance;
        // make current key freshest
        remove(keys, key); // 先删除
        keys.push(key); // 再添加 ，这两行代码实现了lru（Least recently used）算法， 最近最久未使用法
        // abcd, 这时使用到了c, key变成了 abdc，再加一个E， key变成了bdcE,
      } else {
        // delay setting the cache until update
        this.vnodeToCache = vnode; // 缓存组件
        this.keyToCache = key;
      }

      // @ts-expect-error can vnode.data can be undefined
      // 为了防止组件在初始化的时候，init
      vnode.data.keepAlive = true;
    }
    return vnode || (slot && slot[0]); // keep-alive组件本身没有任何的意义，也不会有DOM节点，返回的是VNode
  },
};
