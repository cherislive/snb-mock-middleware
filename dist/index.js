"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var _require = require('path'),
    join = _require.join;

var chokidar = require('chokidar');

var signale = require('signale');

var lodash = require('lodash'); // const register = require('@babel/register');


var _require2 = require('./utils'),
    getMockData = _require2.getMockData,
    cleanRequireCache = _require2.cleanRequireCache,
    getConflictPaths = _require2.getConflictPaths,
    parseRequireDeps = _require2.parseRequireDeps,
    matchMock = _require2.matchMock;

var debug = console;

function createMiddleware(opts) {
  var cwd = opts.cwd,
      mockData = opts.mockData,
      mockWatcherPaths = opts.mockWatcherPaths,
      updateMockData = opts.updateMockData;
  var data = mockData; // watcher

  var errors = [];
  var absMockPath = join(cwd, 'mock'); // const srcMockPath = join(cwd, 'src');

  var absConfigPath = join(cwd, '.umirc.mock.js');
  var watcher = chokidar.watch([absConfigPath, absMockPath].concat(_toConsumableArray(mockWatcherPaths)), {
    ignoreInitial: true
  });
  watcher.on('ready', function () {
    return debug.log('Initial scan complete. Ready for changes');
  }).on('all', // debounce avoiding too much file change events
  lodash.debounce( /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(event, file) {
      var _yield$updateMockData;

      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              debug.log("[".concat(event, "] ").concat(file, ", reload mock data"));
              cleanRequireCache(mockWatcherPaths); // refresh data

              _context.next = 4;
              return updateMockData();

            case 4:
              _context.t1 = _yield$updateMockData = _context.sent;
              _context.t0 = _context.t1 === null;

              if (_context.t0) {
                _context.next = 8;
                break;
              }

              _context.t0 = _yield$updateMockData === void 0;

            case 8:
              if (!_context.t0) {
                _context.next = 12;
                break;
              }

              _context.t2 = void 0;
              _context.next = 13;
              break;

            case 12:
              _context.t2 = _yield$updateMockData.mockData;

            case 13:
              data = _context.t2;

              if (!errors.length) {
                signale.success("Mock file parse success");
              }

            case 15:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }(), 300)); // close

  process.once('SIGINT', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return watcher.close();

          case 2:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  })));
  return {
    middleware: function middleware(req, res, next) {
      var match = data && matchMock(req, data);

      if (match) {
        debug.log("mock matched: [".concat(match.method, "] ").concat(match.path));
        return match.handler(req, res, next);
      } else {
        return next();
      }
    },
    watcher: watcher
  };
}

function mock(api) {
  var cwd = api.cwd,
      config = api.config; // cwd = path
  // u-n
  // api.describe({
  //   key: 'mock',
  //   config: {
  //     schema(joi) {
  //       return joi.object().keys({
  //         exclude: joi
  //           .array()
  //           .items(joi.string())
  //           .description('exclude files not parse mock'),
  //       });
  //     },
  //   },
  // });

  if (process.env.MOCK === 'none') return;

  var registerBabel = function registerBabel(paths) {
    // support
    // clear require cache and set babel register
    var requireDeps = paths.reduce(function (memo, file) {
      memo = memo.concat(parseRequireDeps(file));
      return memo;
    }, []);
    requireDeps.forEach(function (f) {
      if (require.cache[f]) {
        delete require.cache[f];
      }
    }); // u-n
    // api.babelRegister.setOnlyMap({
    //   key: 'mock',
    //   value: [...paths, ...requireDeps],
    // });
  };

  var ignore = [// ignore mock files under node_modules
  'node_modules/**'].concat(_toConsumableArray((config === null || config === void 0 ? void 0 : config.exclude) || [])); // u-n
  // api.addBeforeMiddlewares(async () => {})

  var checkConflictPaths = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(mockRes) {
      var conflictPaths;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              // const routes = await api.getRoutes();  // u-n
              conflictPaths = getConflictPaths({
                // routes,   // u-n
                mockData: mockRes.mockData
              });

              if ((conflictPaths === null || conflictPaths === void 0 ? void 0 : conflictPaths.length) > 0) {
                // [WARN] for conflict path with routes config
                debug.warn('mock paths', conflictPaths.map(function (conflictPath) {
                  return conflictPath.path;
                }), 'conflicts with route config.');
              }

            case 2:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }));

    return function checkConflictPaths(_x3) {
      return _ref3.apply(this, arguments);
    };
  }();

  var mockResult = getMockData({
    cwd: cwd,
    ignore: ignore,
    registerBabel: registerBabel
  }); // check whether conflict when starting

  checkConflictPaths(mockResult);

  var _createMiddleware = createMiddleware(_objectSpread(_objectSpread({
    cwd: cwd
  }, mockResult), {}, {
    updateMockData: function () {
      var _updateMockData = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        var result;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                result = getMockData({
                  cwd: cwd,
                  ignore: ignore,
                  registerBabel: registerBabel
                }); // check whether conflict when updating

                _context4.next = 3;
                return checkConflictPaths(result);

              case 3:
                return _context4.abrupt("return", result);

              case 4:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function updateMockData() {
        return _updateMockData.apply(this, arguments);
      }

      return updateMockData;
    }()
  })),
      middleware = _createMiddleware.middleware;

  return middleware;
}

module.exports = mock;