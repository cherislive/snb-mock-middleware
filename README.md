# snb-mock-middleware
Mock middleware for mocking restful APIs.

## Install
```
yarn add snb-mock-middleware -D
```
or
```
npm install --save-dev snb-mock-middleware
```


## Usage
### Used in the Node environment

```js
const express = require('express');
const path = require('path');
const createtMockMiddleware = require('./dist/index');
var app = express();
app.use(
  createtMockMiddleware({
    cwd: path.join(__dirname, '/'),
  }),
);

const server = app.listen(3000, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
```

### Used in a front-end development environment

``` js
module.exports = {
  devServer: {
    before: (app) => {
      app.use(
        createMock({
          cwd: path.join(__dirname, '/'),
        }),
      );
    },
  }
}
```

## Mock files
For example in file /mock/api.js, you can have content
``` js
const mockjs = require('mockjs');

const getActivities = [
  {
    id: 'trend-1',
    updatedAt: new Date(),
    user: {
      name: '曲丽丽',
    },
    group: {
      name: '高逼格设计天团',
      link: 'http://github.com/',
    },
    project: {
      name: '六月迭代',
      link: 'http://github.com/',
    },
    template: '在 @{group} 新建项目 @{project}',
  },
];

exports.default = {
  'GET /api/activities': getActivities,
  'POST /api/forms': (req, res) => {
    res.send({ message: 'Ok' });
  },
  'GET /api/tags': mockjs.mock({
    'list|100': [{ name: '@city', 'value|1-100': 150, 'type|0-2': 1 }],
  }),
};

```