const { join } = require('path');
const chokidar = require('chokidar');
const signale = require('signale');
const lodash = require('lodash');
// const register = require('@babel/register');

const {
  getMockData,
  cleanRequireCache,
  getConflictPaths,
  parseRequireDeps,
  matchMock,
} = require('./utils');

const debug = console;

function createMiddleware(opts) {
  const { cwd, mockData, mockWatcherPaths, updateMockData } = opts;
  let data = mockData;

  // watcher
  const errors = [];

  const absMockPath = join(cwd, 'mock');
  // const srcMockPath = join(cwd, 'src');
  const absConfigPath = join(cwd, '.umirc.mock.js');

  const watcher = chokidar.watch([absConfigPath, absMockPath, ...mockWatcherPaths], {
    ignoreInitial: true,
  });
  watcher
    .on('ready', () => debug.log('Initial scan complete. Ready for changes'))
    .on(
      'all',
      // debounce avoiding too much file change events
      lodash.debounce(async (event, file) => {
        debug.log(`[${event}] ${file}, reload mock data`);
        cleanRequireCache(mockWatcherPaths);
        // refresh data
        data = (await updateMockData())?.mockData;
        if (!errors.length) {
          signale.success(`Mock file parse success`);
        }
      }, 300),
    );
  // close
  process.once('SIGINT', async () => {
    await watcher.close();
  });

  return {
    middleware: (req, res, next) => {
      const match = data && matchMock(req, data);
      if (match) {
        debug.log(`mock matched: [${match.method}] ${match.path}`);
        return match.handler(req, res, next);
      } else {
        return next();
      }
    },
    watcher,
  };
}

function mock(api) {
  const { cwd, config } = api; // cwd = path

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

  const registerBabel = (paths) => {
    // support
    // clear require cache and set babel register
    const requireDeps = paths.reduce((memo, file) => {
      memo = memo.concat(parseRequireDeps(file));
      return memo;
    }, []);
    requireDeps.forEach((f) => {
      if (require.cache[f]) {
        delete require.cache[f];
      }
    });
    // u-n
    // api.babelRegister.setOnlyMap({
    //   key: 'mock',
    //   value: [...paths, ...requireDeps],
    // });
  };

  const ignore = [
    // ignore mock files under node_modules
    'node_modules/**',
    ...(config?.exclude || []),
  ];

  // u-n
  // api.addBeforeMiddlewares(async () => {})

  const checkConflictPaths = async (mockRes) => {
    // const routes = await api.getRoutes();  // u-n
    const conflictPaths = getConflictPaths({
      // routes,   // u-n
      mockData: mockRes.mockData,
    });
    if (conflictPaths?.length > 0) {
      // [WARN] for conflict path with routes config
      debug.warn(
        'mock paths',
        conflictPaths.map((conflictPath) => conflictPath.path),
        'conflicts with route config.',
      );
    }
  };

  const mockResult = getMockData({
    cwd,
    ignore,
    registerBabel,
  });

  // check whether conflict when starting
  checkConflictPaths(mockResult);

  const { middleware } = createMiddleware({
    cwd,
    ...mockResult,
    updateMockData: async () => {
      const result = getMockData({
        cwd,
        ignore,
        registerBabel,
      });
      // check whether conflict when updating
      await checkConflictPaths(result);
      return result;
    },
  });
  return middleware;
}
module.exports = mock;
