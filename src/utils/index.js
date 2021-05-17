const resolve = require('resolve');
const crequire = require('crequire');
const lodash = require('lodash');
const { dirname, join } = require('path');
const { readFileSync, existsSync } = require('fs');
const pathToRegexp = require('path-to-regexp');
const multer = require('multer');
const bodyParser = require('body-parser');
const glob = require('glob');
const assert = require('assert');

// const debug = console;
const VALID_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const BODY_PARSED_METHODS = ['post', 'put', 'patch'];

// D
const winPath = (path) => {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  if (isExtendedLengthPath) {
    return path;
  }
  return path.replace(/\\/g, '/');
};

// D
const getMockConfig = (files) => {
  return files.reduce((memo, mockFile) => {
    try {
      const m = require(mockFile); // eslint-disable-line
      memo = {
        ...memo,
        ...(m.default || m),
      };
      return memo;
    } catch (e) {
      throw new Error(e.stack);
    }
  }, {});
};

// D
const parse = (filePath) => {
  const content = readFileSync(filePath, 'utf-8');
  return (crequire(content) || [])
    .map((o) => o.path)
    .filter((path) => path.charAt(0) === '.')
    .map((path) =>
      winPath(
        resolve.sync(path, {
          basedir: dirname(filePath),
          extensions: ['.tsx', '.ts', '.jsx', '.js'],
        }),
      ),
    );
};

// D
const parseRequireDeps = (filePath) => {
  const paths = [filePath];
  const ret = [winPath(filePath)];

  while (paths.length) {
    // 避免依赖循环
    const nextPaths = paths.shift();
    const extraPaths = nextPaths.length ? lodash.pullAll(parse(nextPaths), ret) : [];
    if (extraPaths.length) {
      paths.push(...extraPaths);
      ret.push(...extraPaths);
    }
  }

  return ret;
};

// D
const matchMock = (req, mockData) => {
  const { path: targetPath, method } = req;
  const targetMethod = method.toLowerCase();

  for (const mock of mockData) {
    const { method, re, keys } = mock;
    if (method === targetMethod) {
      const match = re.exec(targetPath);
      if (match) {
        const params = {};
        for (let i = 1; i < match.length; i += 1) {
          const key = keys[i - 1];
          const prop = key.name;
          const val = decodeParam(match[i]);
          // @ts-ignore
          if (val !== undefined || !hasOwnProdperty.call(params, prop)) {
            params[prop] = val;
          }
        }
        req.params = params;
        return mock;
      }
    }
  }
};

/**
 * D
 * flatten routes using routes config
 * @param opts
 */
const getFlatRoutes = (opts) => {
  if (!opts || !opts.routes) return [];
  return opts.routes.reduce((memo, route) => {
    const { routes, path } = route;
    if (path && !path.includes('?')) {
      memo.push(route);
    }
    if (routes) {
      memo = memo.concat(
        getFlatRoutes({
          routes,
        }),
      );
    }
    return memo;
  }, []);
};

/**
 * D
 * check if mock path conflict with router path
 * @param param0
 */
const getConflictPaths = ({ mockData, routes }) => {
  const conflictPaths = [];
  getFlatRoutes({ routes }).forEach((route) => {
    const { path, redirect } = route;
    if (path && !path.startsWith(':') && !redirect) {
      const req = {
        path: !path.startsWith('/') ? `/${path}` : path,
        method: 'get',
      };
      const matched = matchMock(req, mockData);
      if (matched) {
        conflictPaths.push({ path: matched.path });
      }
    }
  });
  return conflictPaths;
};

// D
const createHandler = (method, path, handler) => {
  return function (req, res, next) {
    if (BODY_PARSED_METHODS.includes(method)) {
      bodyParser.json({ limit: '5mb', strict: false })(req, res, () => {
        bodyParser.urlencoded({ limit: '5mb', extended: true })(req, res, () => {
          sendData();
        });
      });
    } else {
      sendData();
    }

    function sendData() {
      if (typeof handler === 'function') {
        multer().any()(req, res, () => {
          handler(req, res, next);
        });
      } else {
        res.json(handler);
      }
    }
  };
};

// D
const parseKey = (key) => {
  let method = 'get';
  let path = key;
  if (key.indexOf(' ') > -1) {
    const splited = key.split(' ');
    method = splited[0].toLowerCase();
    path = splited[1]; // eslint-disable-line
  }
  assert(
    VALID_METHODS.includes(method),
    `Invalid method ${method} for path ${path}, please check your mock files.`,
  );
  return {
    method,
    path,
  };
};

// D
const normalizeConfig = (config) => {
  return Object.keys(config).reduce((memo, key) => {
    const handler = config[key];
    const type = typeof handler;
    assert(
      type === 'function' || type === 'object',
      `mock value of ${key} should be function or object, but got ${type}`,
    );
    const { method, path } = parseKey(key);
    const keys = [];
    const pathOptions = {
      whitelist: ['%'], // treat %3A as regular chars
    };
    const re = pathToRegexp(path, keys, pathOptions);
    memo.push({
      method,
      path,
      re,
      keys,
      handler: createHandler(method, path, handler),
    });
    return memo;
  }, []);
};

// D
const cleanRequireCache = (paths) => {
  Object.keys(require.cache).forEach((file) => {
    if (
      paths.some((path) => {
        return winPath(file).indexOf(path) > -1;
      })
    ) {
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
const getMockData = ({ cwd, ignore = [], registerBabel = () => {} }) => {
  // Clear errors
  // errors.splice(0, errors.length);
  // cleanRequireCache(mockWatcherPaths);
  const mockPaths = [
    ...(glob.sync('mock/**/*.[jt]s', {
      cwd,
      ignore,
    }) || []),
    ...(glob.sync('**/_mock.[jt]s', {
      cwd,
      ignore,
    }) || []),
    '.umirc.mock.js',
    '.umirc.mock.ts',
  ]
    .map((path) => join(cwd, path))
    .filter((path) => path && existsSync(path))
    .map((path) => winPath(path));

  // debug.log(`load mock data including files ${JSON.stringify(mockPaths)}`);

  // register babel
  registerBabel(mockPaths);

  // get mock data
  const mockData = normalizeConfig(getMockConfig(mockPaths));

  const mockWatcherPaths = [...(mockPaths || []), join(cwd, 'mock')]
    .filter((path) => path && existsSync(path))
    .map((path) => winPath(path));

  return {
    mockData,
    mockPaths,
    mockWatcherPaths,
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
