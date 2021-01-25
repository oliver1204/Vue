const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

/**
 * 字符拼接称 _c('div', {background: red}, _C(), _c())
 */
export function generate(ast) {
  const code = ast ? genElement(ast) : '_c("div")';

  return code;
}

export function genElement(el) {
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
  attrs.forEach((item) => {
    if (item.name === 'style') {
      let obj = {};
      // style="color: red" => style: {"color: red"}
      item.value.split(';').forEach((c) => {
        let [key, value] = c.split(':');
        obj[key] = value.replace(/\s/g, '');
      });
      item.value = obj;
    }
    // if(item.name === 'className') ....
    str += `${item.name}:${JSON.stringify(item.value)},`;
  });

  return `{${str.slice(0, -1)}}`;
}
function genChildren(children) {
  if (children && children.length) {
    return children.map((child) => gen(child)).join(',');
  } else {
    return false;
  }
}
function gen(node) {
  // 元素
  if (node.type === 1) return generate(node);
  // 文本
  // 正则的 lastIndex https://zhuanlan.zhihu.com/p/147665861
  let text = node.text; // hello, {{message}}, hello
  let tokens = [];
  let match, index;
  let lastIndex = (defaultTagRE.lastIndex = 0);

  while ((match = defaultTagRE.exec(text))) {
    index = match.index;
    // push text token
    if (index > lastIndex) {
      tokens.push(JSON.stringify(text.slice(lastIndex, index)));
    }
    // tag token
    tokens.push(`_s(${match[1].trim()})`);
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push(JSON.stringify(text.slice(lastIndex)));
  }

  return `_v(${tokens.join('+')})`;
}
