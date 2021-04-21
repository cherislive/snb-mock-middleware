"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var resolve = require('resolve');

var crequire = require('crequire');

var lodash = require('lodash');

var _require = require('path'),
    dirname = _require.dirname,
    join = _require.join;

var _require2 = require('fs'),
    readFileSync = _require2.readFileSync,
    existsSync = _require2.existsSync;

var pathToRegexp = require('path-to-regexp');

var multer = require('multer');

var bodyParser = require('body-parser');

var glob = require('glob');

var assert = require('assert'); // const debug = console;


var VALID_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
var BODY_PARSED_METHODS = ['post', 'put', 'patch']; // D

var winPath = function winPath(path) {
  var isExtendedLengthPath = /^\\\\\?\\/.test(path);

  if (isExtendedLengthPath) {
    return path;
  }

  return path.replace(/\\/g, '/');
}; // D


var getMockConfig = function getMockConfig(files) {
  return files.reduce(function (memo, mockFile) {
    try {
      var m = require(mockFile); // eslint-disable-line


      memo = _objectSpread(_objectSpread({}, memo), m["default"] || m);
      return memo;
    } catch (e) {
      throw new Error(e.stack);
    }
  }, {});
}; // D


var parse = function parse(filePath) {
  var content = readFileSync(filePath, 'utf-8');
  return (crequire(content) || []).map(function (o) {
    return o.path;
  }).filter(function (path) {
    return path.charAt(0) === '.';
  }).map(function (path) {
    return winPath(resolve.sync(path, {
      basedir: dirname(filePath),
      extensions: ['.tsx', '.ts', '.jsx', '.js']
    }));
  });
}; // D


var parseRequireDeps = function parseRequireDeps(filePath) {
  var paths = [filePath];
  var ret = [winPath(filePath)];

  while (paths.length) {
    // 避免依赖循环
    var nextPaths = paths.shift();
    var extraPaths = nextPaths.length ? lodash.pullAll(parse(nextPaths), ret) : [];

    if (extraPaths.length) {
      paths.push.apply(paths, _toConsumableArray(extraPaths));
      ret.push.apply(ret, _toConsumableArray(extraPaths));
    }
  }

  return ret;
}; // D


var matchMock = function matchMock(req, mockData) {
  var targetPath = req.path,
      method = req.method;
  var targetMethod = method.toLowerCase();

  var _iterator = _createForOfIteratorHelper(mockData),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var mock = _step.value;
      var _method = mock.method,
          re = mock.re,
          keys = mock.keys;

      if (_method === targetMethod) {
        var match = re.exec(targetPath);

        if (match) {
          var params = {};

          for (var i = 1; i < match.length; i += 1) {
            var key = keys[i - 1];
            var prop = key.name;
            var val = decodeParam(match[i]); // @ts-ignore

            if (val !== undefined || !hasOwnProdperty.call(params, prop)) {
              params[prop] = val;
            }
          }

          req.params = params;
          return mock;
        }
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
};
/**
 * D
 * flatten routes using routes config
 * @param opts
 */


var getFlatRoutes = function getFlatRoutes(opts) {
  if (!opts || !opts.routes) return [];
  return opts.routes.reduce(function (memo, route) {
    var routes = route.routes,
        path = route.path;

    if (path && !path.includes('?')) {
      memo.push(route);
    }

    if (routes) {
      memo = memo.concat(getFlatRoutes({
        routes: routes
      }));
    }

    return memo;
  }, []);
};
/**
 * D
 * check if mock path conflict with router path
 * @param param0
 */


var getConflictPaths = function getConflictPaths(_ref) {
  var mockData = _ref.mockData,
      routes = _ref.routes;
  var conflictPaths = [];
  getFlatRoutes({
    routes: routes
  }).forEach(function (route) {
    var path = route.path,
        redirect = route.redirect;

    if (path && !path.startsWith(':') && !redirect) {
      var req = {
        path: !path.startsWith('/') ? "/".concat(path) : path,
        method: 'get'
      };
      var matched = matchMock(req, mockData);

      if (matched) {
        conflictPaths.push({
          path: matched.path
        });
      }
    }
  });
  return conflictPaths;
}; // D


var createHandler = function createHandler(method, path, handler) {
  return function (req, res, next) {
    if (BODY_PARSED_METHODS.includes(method)) {
      bodyParser.json({
        limit: '5mb',
        strict: false
      })(req, res, function () {
        bodyParser.urlencoded({
          limit: '5mb',
          extended: true
        })(req, res, function () {
          sendData();
        });
      });
    } else {
      sendData();
    }

    function sendData() {
      if (typeof handler === 'function') {
        multer().any()(req, res, function () {
          handler(req, res, next);
        });
      } else {
        res.json(handler);
      }
    }
  };
}; // D


var parseKey = function parseKey(key) {
  var method = 'get';
  var path = key;

  if (key.indexOf(' ') > -1) {
    var splited = key.split(' ');
    method = splited[0].toLowerCase();
    path = splited[1]; // eslint-disable-line
  }

  assert(VALID_METHODS.includes(method), "Invalid method ".concat(method, " for path ").concat(path, ", please check your mock files."));
  return {
    method: method,
    path: path
  };
}; // D


var normalizeConfig = function normalizeConfig(config) {
  return Object.keys(config).reduce(function (memo, key) {
    var handler = config[key];

    var type = _typeof(handler);

    assert(type === 'function' || type === 'object', "mock value of ".concat(key, " should be function or object, but got ").concat(type));

    var _parseKey = parseKey(key),
        method = _parseKey.method,
        path = _parseKey.path;

    var keys = [];
    var pathOptions = {
      whitelist: ['%'] // treat %3A as regular chars

    };
    var re = pathToRegexp(path, keys, pathOptions);
    memo.push({
      method: method,
      path: path,
      re: re,
      keys: keys,
      handler: createHandler(method, path, handler)
    });
    return memo;
  }, []);
}; // D


var cleanRequireCache = function cleanRequireCache(paths) {
  Object.keys(require.cache).forEach(function (file) {
    if (paths.some(function (path) {
      return winPath(file).indexOf(path) > -1;
    })) {
      delete require.cache[file];
    }
  });
};
/**
 * mock/*
 * .umirc.mock.js
 * .umirc.mock.ts
 * src/** or pages/**
 *
 * @param param
 */


var getMockData = function getMockData(_ref2) {
  var cwd = _ref2.cwd,
      _ref2$ignore = _ref2.ignore,
      ignore = _ref2$ignore === void 0 ? [] : _ref2$ignore,
      _ref2$registerBabel = _ref2.registerBabel,
      registerBabel = _ref2$registerBabel === void 0 ? function () {} : _ref2$registerBabel;
  // Clear errors
  // errors.splice(0, errors.length);
  // cleanRequireCache(mockWatcherPaths);
  var mockPaths = [].concat(_toConsumableArray(glob.sync('mock/**/*.[jt]s', {
    cwd: cwd,
    ignore: ignore
  }) || []), _toConsumableArray(glob.sync('**/_mock.[jt]s', {
    cwd: cwd,
    ignore: ignore
  }) || []), ['.umirc.mock.js', '.umirc.mock.ts']).map(function (path) {
    return join(cwd, path);
  }).filter(function (path) {
    return path && existsSync(path);
  }).map(function (path) {
    return winPath(path);
  }); // debug.log(`load mock data including files ${JSON.stringify(mockPaths)}`);
  // register babel

  registerBabel(mockPaths); // get mock data

  var mockData = normalizeConfig(getMockConfig(mockPaths));
  var mockWatcherPaths = [].concat(_toConsumableArray(mockPaths || []), [join(cwd, 'mock')]).filter(function (path) {
    return path && existsSync(path);
  }).map(function (path) {
    return winPath(path);
  });
  return {
    mockData: mockData,
    mockPaths: mockPaths,
    mockWatcherPaths: mockWatcherPaths
  };
};

module.exports.parse = parse;
module.exports.winPath = winPath;
module.exports.getMockConfig = getMockConfig;
module.exports.parseRequireDeps = parseRequireDeps;
module.exports.getMockData = getMockData;
module.exports.cleanRequireCache = cleanRequireCache;
module.exports.getConflictPaths = getConflictPaths;
module.exports.matchMock = matchMock;