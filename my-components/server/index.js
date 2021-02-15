const Koa = require('./koa');

let app = new Koa();

app.use(async (ctx) => {
  if (ctx.url === '/img/lists') {
    ctx.body = ctx.request.body;
  } else {
    ctx.body = 'not found';
  }
});

app.listen(3000);
