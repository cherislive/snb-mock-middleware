const express = require('express');
const path = require('path');
const createtMockMiddleware = require('./src/index');
var app = express();
app.use(
  createtMockMiddleware({
    cwd: path.join(__dirname, '/'),
  }),
);

const server = app.listen(3018, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
