const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force resolve native modules directly to prevent bundling issues
config.resolver.extraNodeModules = {
  '@babel/runtime': path.resolve(projectRoot, 'node_modules/@babel/runtime'),
  '@clerk/clerk-expo': path.resolve(projectRoot, 'node_modules/@clerk/clerk-expo'),
  'expo-crypto': path.resolve(projectRoot, 'node_modules/expo-crypto'),
  'expo-secure-store': path.resolve(projectRoot, 'node_modules/expo-secure-store'),
};

// 4. Critical: Enable symlinks for pnpm
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
