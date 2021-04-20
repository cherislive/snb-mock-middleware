"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMockConfig = getMockConfig;
exports.parseRequireDeps = parseRequireDeps;

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
    dirname = _require.dirname;

var _require2 = require('fs'),
    readFileSync = _require2.readFileSync;

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

;

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