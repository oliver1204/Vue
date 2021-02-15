import Vue from 'vue';
import MessageComponent from './message.vue';
// 在内存中构架一个组件实例，插入页面中
const getInstance = () => {
  let vm = new Vue({
    render: (h) => h(MessageComponent),
  }).$mount();
  document.body.appendChild(vm.$el);

  let component = vm.$children[0];
  return {
    add(options) {
      component.add(options);
    },
  };
};
let instance;
const getIns = () => {
  instance = instance || getInstance();

  return instance;
};
const Message = {
  info(options) {
    getIns().add(options);
  },
  success() {},
  error() {},
  warning() {},
};
export { Message };

// Vue.use  自动会调用组件内部的install方法
// 写插件的原理
let _Vue;
export default {
  install(Vue) {
    if (!_Vue) {
      // 防止多次Vue.use
      _Vue = Vue;
      let $message = {};

      Object.keys(Message).forEach((type) => {
        $message[type] = Message[type];
      });
      Vue.prototype.$message = $message;
    }
  },
};
