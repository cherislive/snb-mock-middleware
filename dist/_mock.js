"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _url = require("url");

// mock tableListDataSource
var tableListDataSource = [];

for (var i = 0; i < 46; i += 1) {
  tableListDataSource.push({
    key: i,
    disabled: i % 6 === 0,
    href: 'https://ant.design',
    avatar: ['https://gw.alipayobjects.com/zos/rmsportal/eeHMaZBwmTvLdIwMfBpg.png', 'https://gw.alipayobjects.com/zos/rmsportal/udxAbMEhpwthVVcjLXik.png'][i % 2],
    name: "TradeCode ".concat(i),
    title: "\u4E00\u4E2A\u4EFB\u52A1\u540D\u79F0 ".concat(i),
    owner: '曲丽丽',
    desc: '这是一段描述',
    callNo: Math.floor(Math.random() * 1000),
    status: Math.floor(Math.random() * 10) % 4,
    updatedAt: new Date("2017-07-".concat(Math.floor(i / 2) + 1)),
    createdAt: new Date("2017-07-".concat(Math.floor(i / 2) + 1)),
    progress: Math.ceil(Math.random() * 100)
  });
}

function getRule(req, res, u) {
  var url = u;

  if (!url || Object.prototype.toString.call(url) !== '[object String]') {
    url = req.url; // eslint-disable-line
  }

  var params = (0, _url.parse)(url, true).query;
  var dataSource = tableListDataSource;

  if (params.sorter) {
    var s = params.sorter.split('_');
    dataSource = dataSource.sort(function (prev, next) {
      if (s[1] === 'descend') {
        return next[s[0]] - prev[s[0]];
      }

      return prev[s[0]] - next[s[0]];
    });
  }

  if (params.status) {
    var status = params.status.split(',');
    var filterDataSource = [];
    status.forEach(function (s) {
      filterDataSource = filterDataSource.concat(dataSource.filter(function (data) {
        return parseInt(data.status, 10) === parseInt(s[0], 10);
      }));
    });
    dataSource = filterDataSource;
  }

  if (params.name) {
    dataSource = dataSource.filter(function (data) {
      return data.name.indexOf(params.name) > -1;
    });
  }

  var pageSize = 10;

  if (params.pageSize) {
    pageSize = params.pageSize * 1;
  }

  var result = {
    list: dataSource,
    pagination: {
      total: dataSource.length,
      pageSize: pageSize,
      current: parseInt(params.currentPage, 10) || 1
    }
  };

  if (res && res.json) {
    res.json(result);
  } else {
    return result;
  }
}

function postRule(req, res, u, b) {
  var url = u;

  if (!url || Object.prototype.toString.call(url) !== '[object String]') {
    url = req.url; // eslint-disable-line
  }

  var body = b && b.body || req.body;
  var method = body.method,
      name = body.name,
      desc = body.desc,
      key = body.key;

  switch (method) {
    /* eslint no-case-declarations:0 */
    case 'delete':
      tableListDataSource = tableListDataSource.filter(function (item) {
        return key.indexOf(item.key) === -1;
      });
      break;

    case 'post':
      var _i = Math.ceil(Math.random() * 10000);

      tableListDataSource.unshift({
        key: _i,
        href: 'https://ant.design',
        avatar: ['https://gw.alipayobjects.com/zos/rmsportal/eeHMaZBwmTvLdIwMfBpg.png', 'https://gw.alipayobjects.com/zos/rmsportal/udxAbMEhpwthVVcjLXik.png'][_i % 2],
        name: "TradeCode ".concat(_i),
        title: "\u4E00\u4E2A\u4EFB\u52A1\u540D\u79F0 ".concat(_i),
        owner: '曲丽丽',
        desc: desc,
        callNo: Math.floor(Math.random() * 1000),
        status: Math.floor(Math.random() * 10) % 2,
        updatedAt: new Date(),
        createdAt: new Date(),
        progress: Math.ceil(Math.random() * 100)
      });
      break;

    case 'update':
      tableListDataSource = tableListDataSource.map(function (item) {
        if (item.key === key) {
          Object.assign(item, {
            desc: desc,
            name: name
          });
          return item;
        }

        return item;
      });
      break;

    default:
      break;
  }

  var result = {
    list: tableListDataSource,
    pagination: {
      total: tableListDataSource.length
    }
  };

  if (res && res.json) {
    res.json(result);
  } else {
    return result;
  }
}

var _default = {
  'GET /api/rule': getRule,
  'POST /api/rule': postRule
};
exports["default"] = _default;