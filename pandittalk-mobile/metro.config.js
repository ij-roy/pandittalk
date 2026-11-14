const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Metro can fail to resolve subpath imports like `./ImageManipulator.types`
  // when the target file is named `ImageManipulator.types.ts`.
  if (moduleName.startsWith('./') && moduleName.endsWith('.types')) {
    const tsPath = path.join(
      path.dirname(context.originModulePath),
      `${moduleName.slice(2)}.ts`,
    );
    if (fs.existsSync(tsPath)) {
      return { type: 'sourceFile', filePath: tsPath };
    }
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
