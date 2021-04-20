const resolve = require('resolve');
const crequire = require('crequire');
const lodash = require('lodash');
const { dirname } = require('path');
const { readFileSync } = require('fs');

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

function winPath(path) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  if (isExtendedLengthPath) {
    return path;
  }
  return path.replace(/\\/g, '/');
}



export function getMockConfig (files) {
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

export function parseRequireDeps (filePath) {
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
