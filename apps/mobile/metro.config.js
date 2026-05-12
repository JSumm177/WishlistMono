const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Resolve modules from both local and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force pnpm compatibility
config.resolver.unstable_enableSymlinks = true;

// Ensure we don't try to resolve node native modules for the mobile app
config.resolver.blockList = [
  /.*\/packages\/db\/node_modules\/.*/,
];

module.exports = config;
