## parse-html
### $mount

vue 在 mount时， 如果用户传入el需要将页面渲染出来，默认先找render方法，如果没有render方法，再找template，如果都没有就使用el对应的html。

在使用过程中，需要将template转成render。

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