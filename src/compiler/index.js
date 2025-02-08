// vue 模版编译靠的是正则
import { parseHTML } from './parser/html-parser';
import { generate } from './codegen/index';

export function compileToFunctions(template) {
  // 1)html => ast 语法树
  let ast = parseHTML(template);

  // 2)ast => render，即模版引擎的实现（本质字符串拼接）如下：
  // <div id="app"><p>hello{{message}}</div>
  // _c('div', {id: add}), _c('p', undefine, _v('hello' + _s('message'), _c(), _c()...))
  let code = generate(ast);
  // 3) 创建 render Function
  let renderFunction = new Function(`
    with(this) { 
      return ${code}
    }
  `);

  return renderFunction;
}
