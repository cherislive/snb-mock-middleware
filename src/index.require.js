// const { existsSync } = require('fs');
const resolve = require('resolve');
const crequire = require('crequire');
const lodash = require('lodash');
const { join, dirname } = require('path');
const bodyParser = require('body-parser');
const glob = require('glob');
const assert = require('assert');
const chokidar = require('chokidar');
const pathToRegexp = require('path-to-regexp');
// const register = require('@babel/register');
const multer = require('multer');
const signale = require('signale');
const { existsSync, readFileSync } = require('fs');

// const { parseRequireDeps } = require('./utils');

const debug = console.log;

const VALID_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const BODY_PARSED_METHODS = ['post', 'put', 'patch'];
const errors = [];

function winPath(path) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  if (isExtendedLengthPath) {
    return path;
  }
  return path.replace(/\\/g, '/');
}

function getMockConfig(files) {
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
}

function parse(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  return (
    (crequire(content) || []).map((o) => o.path)
      .filter((path) => path.charAt(0) === '.')
      .map((path) =>
        winPath(
          resolve.sync(path, {
            basedir: dirname(filePath),
            extensions: ['.tsx', '.ts', '.jsx', '.js'],
          }),
        ),
      )
  );
}

function parseRequireDeps (filePath) {
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
}

function getMockMiddleware(path, options = {}) {
  const absMockPath = join(path, 'mock');
  const absConfigPath = join(path, '.umirc.mock.js');

  const ignore = [];

  // ?** S
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

  let mockData = getConfig();
  watch();

  function watch() {
    if (process.env.WATCH_FILES === 'none') return;
    const watcher = chokidar.watch([absConfigPath, absMockPath], {
      ignoreInitial: true,
    });
    watcher.on('all', (event, file) => {
      debug(`[${event}] ${file}, reload mock data`);
      mockData = getConfig();
      if (!errors.length) {
        signale.success(`Mock file parse success`);
      }
    });
  }

  function getConfig() {
    // Clear errors
    errors.splice(0, errors.length);
    cleanRequireCache();
    const cwd = join(path, ''); // mock

    const mockFiles = [
      ...(glob.sync('mock/**/*.[jt]s', {
        cwd,
        ignore,
      }) || []),
      ...(glob.sync('**/_mock.[jt]s', {
        cwd,
        ignore,
      }) || []),
    ]
      .map((path) => join(cwd, path))
      .filter((path) => path && existsSync(path))
      .map((path) => winPath(path));

    debug(`load mock data including files ${JSON.stringify(mockFiles)}`);

    // register babel
    // support
    // clear require cache and set babel register
    const requireDeps = mockFiles.reduce((memo, file) => {
      memo = memo.concat(parseRequireDeps(file));
      return memo;
    }, []);
    requireDeps.forEach((f) => {
      if (require.cache[f]) {
        delete require.cache[f];
      }
    });

    // return normalizeConfig(requireDeps);
    // get mock data
    const mockData = normalizeConfig(getMockConfig(mockFiles));
    return mockData;
    // const mockWatcherPaths = [...(mockFiles || []), join(cwd, 'mock')]
    // .filter((path) => path && existsSync(path))
    // .map((path) => winPath(path));
    // {
    //   mockData,
    //   mockPaths: mockFiles,
    //   mockWatcherPaths,
    // }
  }

  function parseKey(key) {
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
  }

  function createHandler(method, path, handler) {
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
  }

  function normalizeConfig(config) {
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
  }

  function cleanRequireCache() {
    Object.keys(require.cache).forEach((file) => {
      if (file === absConfigPath || file.indexOf(absMockPath) > -1) {
        delete require.cache[file];
      }
    });
  }

  function matchMock(req) {
    const { path: exceptPath } = req;
    const exceptMethod = req.method.toLowerCase();
    for (const mock of mockData) {
      const { method, re, keys } = mock;
      if (method === exceptMethod) {
        const match = re.exec(req.path);
        if (match) {
          const params = {};

          for (let i = 1; i < match.length; i = i + 1) {
            const key = keys[i - 1];
            const prop = key.name;
            const val = decodeParam(match[i]);

            if (val !== undefined || !hasOwnProperty.call(params, prop)) {
              params[prop] = val;
            }
          }
          req.params = params;
          return mock;
        }
      }
    }

    function decodeParam(val) {
      if (typeof val !== 'string' || val.length === 0) {
        return val;
      }

      try {
        return decodeURIComponent(val);
      } catch (err) {
        if (err instanceof URIError) {
          err.message = `Failed to decode param ' ${val} '`;
          err.status = err.statusCode = 400;
        }

        throw err;
      }
    }

    return mockData.filter(({ method, re }) => {
      return method === exceptMethod && re.test(exceptPath);
    })[0];
  }

  return (req, res, next) => {
    const match = matchMock(req);

    if (match) {
      debug(`mock matched: [${match.method}] ${match.path}`);
      return match.handler(req, res, next);
    } else {
      return next();
    }
  };
}
module.exports = getMockMiddleware;
