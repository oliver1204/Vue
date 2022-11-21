import { initMixin } from "./mixin";
import { extend } from "../util/index";
import builtInComponents from "../components/index";

// 把keep-alive 构建到全局
extend(Vue.options.components, builtInComponents);
