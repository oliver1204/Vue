const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // aa-aaa
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; // <aaa:abcd>
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则，捕获的内容是标签内容
const startTagClose = /^\s*(\/?)>/; // 匹配结束标签>
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签的结尾的 </div>
const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性
const doctype = /^<!DOCTYPE [^>]+>/i;
const comment = /^<!\--/;
const conditionalComment = /^<!\[/;
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/;

export function parseHTML(html, options) {
  let root = null;
  let currentParent = null;
  let stack = []; // ['div', 'p', 'span', 'span', 'p', 'div',]

  function createASTElement(tag, attrs) {
    return {
      type: 1,
      tag,
      attrsList: attrs,
      parent: null,
      children: [],
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
        text,
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
    let testEnd = html.indexOf('<');
    // Start tag: 即，< 处在开始位置
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
    }

    // End tag:
    const endTagMatch = html.match(endTag);
    if (endTagMatch) {
      advance(endTagMatch[0].length);
      end(endTagMatch[1]);
      continue;
    }

    // Doctype:
    const doctypeMatch = html.match(doctype);
    if (doctypeMatch) {
      advance(doctypeMatch[0].length);
      continue;
    }
    // Comment:
    if (comment.test(html)) {
      const commentEnd = html.indexOf('-->');

      if (commentEnd >= 0) {
        if (options.shouldKeepComment) {
          options.comment(
            html.substring(4, commentEnd),
            index,
            index + commentEnd + 3
          );
        }
        advance(commentEnd + 3);
        continue;
      }
    }
  }

  // 截取
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
        attrs: [],
      };
      advance(start[0].length);
      let end, attr;
      // 结束标签> 不存在，并且有属性
      while (
        !(end = html.match(startTagClose)) &&
        (attr = html.match(dynamicArgAttribute) || html.match(attribute))
      ) {
        advance(attr[0].length);
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5] || '',
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
