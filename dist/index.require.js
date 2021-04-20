"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// const { existsSync } = require('fs');
var resolve = require('resolve');

var crequire = require('crequire');

var lodash = require('lodash');

var _require = require('path'),
    join = _require.join,
    dirname = _require.dirname;

var bodyParser = require('body-parser');

var glob = require('glob');

var assert = require('assert');

var chokidar = require('chokidar');

var pathToRegexp = require('path-to-regexp'); // const register = require('@babel/register');


var multer = require('multer');

var signale = require('signale');

var _require2 = require('fs'),
    existsSync = _require2.existsSync,
    readFileSync = _require2.readFileSync; // const { parseRequireDeps } = require('./utils');


var debug = console.log;
var VALID_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
var BODY_PARSED_METHODS = ['post', 'put', 'patch'];
var errors = [];

function winPath(path) {
  var isExtendedLengthPath = /^\\\\\?\\/.test(path);

  if (isExtendedLengthPath) {
    return path;
  }

  return path.replace(/\\/g, '/');
}

function getMockConfig(files) {
  return files.reduce(function (memo, mockFile) {
    try {
      var m = require(mockFile); // eslint-disable-line


      memo = _objectSpread(_objectSpread({}, memo), m["default"] || m);
      return memo;
    } catch (e) {
      throw new Error(e.stack);
    }
  }, {});
}

function parse(filePath) {
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
}

function parseRequireDeps(filePath) {
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
}

function getMockMiddleware(path) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var absMockPath = join(path, 'mock');
  var absConfigPath = join(path, '.umirc.mock.js');
  var ignore = []; // ?** S
  // register({
  //   presets: ['umi'],
  //   plugins: [
  //     require.resolve('babel-plugin-add-module-exports'),
  //     require.resolve('@babel/plugin-transform-modules-commonjs'),
  //   ],
  //   babelrc: false,
  //   only: [absMockPath],
  // });
  // ?** E

  var mockData = getConfig();
  watch();

  function watch() {
    if (process.env.WATCH_FILES === 'none') return;
    var watcher = chokidar.watch([absConfigPath, absMockPath], {
      ignoreInitial: true
    });
    watcher.on('all', function (event, file) {
      debug("[".concat(event, "] ").concat(file, ", reload mock data"));
      mockData = getConfig();

      if (!errors.length) {
        signale.success("Mock file parse success");
      }
    });
  }

  function getConfig() {
    // Clear errors
    errors.splice(0, errors.length);
    cleanRequireCache();
    var cwd = join(path, ''); // mock

    var mockFiles = [].concat(_toConsumableArray(glob.sync('mock/**/*.[jt]s', {
      cwd: cwd,
      ignore: ignore
    }) || []), _toConsumableArray(glob.sync('**/_mock.[jt]s', {
      cwd: cwd,
      ignore: ignore
    }) || [])).map(function (path) {
      return join(cwd, path);
    }).filter(function (path) {
      return path && existsSync(path);
    }).map(function (path) {
      return winPath(path);
    });
    debug("load mock data including files ".concat(JSON.stringify(mockFiles))); // register babel
    // support
    // clear require cache and set babel register

    var requireDeps = mockFiles.reduce(function (memo, file) {
      memo = memo.concat(parseRequireDeps(file));
      return memo;
    }, []);
    requireDeps.forEach(function (f) {
      if (require.cache[f]) {
        delete require.cache[f];
      }
    }); // return normalizeConfig(requireDeps);
    // get mock data

    var mockData = normalizeConfig(getMockConfig(mockFiles));
    return mockData; // const mockWatcherPaths = [...(mockFiles || []), join(cwd, 'mock')]
    // .filter((path) => path && existsSync(path))
    // .map((path) => winPath(path));
    // {
    //   mockData,
    //   mockPaths: mockFiles,
    //   mockWatcherPaths,
    // }
  }

  function parseKey(key) {
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
  }

  function createHandler(method, path, handler) {
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
  }

  function normalizeConfig(config) {
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
  }

  function cleanRequireCache() {
    Object.keys(require.cache).forEach(function (file) {
      if (file === absConfigPath || file.indexOf(absMockPath) > -1) {
        delete require.cache[file];
      }
    });
  }

  function matchMock(req) {
    var exceptPath = req.path;
    var exceptMethod = req.method.toLowerCase();

    var _iterator = _createForOfIteratorHelper(mockData),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var mock = _step.value;
        var method = mock.method,
            re = mock.re,
            keys = mock.keys;

        if (method === exceptMethod) {
          var match = re.exec(req.path);

          if (match) {
            var params = {};

            for (var i = 1; i < match.length; i = i + 1) {
              var key = keys[i - 1];
              var prop = key.name;
              var val = decodeParam(match[i]);

              if (val !== undefined || !hasOwnProperty.call(params, prop)) {
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

    function decodeParam(val) {
      if (typeof val !== 'string' || val.length === 0) {
        return val;
      }

      try {
        return decodeURIComponent(val);
      } catch (err) {
        if (err instanceof URIError) {
          err.message = "Failed to decode param ' ".concat(val, " '");
          err.status = err.statusCode = 400;
        }

        throw err;
      }
    }

    return mockData.filter(function (_ref) {
      var method = _ref.method,
          re = _ref.re;
      return method === exceptMethod && re.test(exceptPath);
    })[0];
  }

  return function (req, res, next) {
    var match = matchMock(req);

    if (match) {
      debug("mock matched: [".concat(match.method, "] ").concat(match.path));
      return match.handler(req, res, next);
    } else {
      return next();
    }
  };
}

module.exports = getMockMiddleware;