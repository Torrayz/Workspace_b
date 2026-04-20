// ============================================================================
// Metro Config — Monorepo + Duplicate React Prevention
// 
// Problem: npm workspaces hoists react@18 (web) to root/node_modules,
// while mobile needs react@19. Metro sees both → "Invalid hook call" crash.
// 
// Solution: Force Metro to resolve critical packages ONLY from
// apps/mobile/node_modules, never from the root workspace.
// ============================================================================

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch monorepo root for shared packages
config.watchFolders = [workspaceRoot];

// 2. Resolve node_modules: mobile first, then root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. CRITICAL: Force these packages to resolve from mobile's node_modules ONLY
// This prevents the "Invalid hook call" error from duplicate React copies
config.resolver.extraNodeModules = {
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react/jsx-runtime': path.resolve(projectRoot, 'node_modules/react/jsx-runtime'),
  'react/jsx-dev-runtime': path.resolve(projectRoot, 'node_modules/react/jsx-dev-runtime'),
};

// 4. Block duplicate react/react-native copies from being bundled
config.resolver.blockList = [
  // Block root node_modules/react (v18) - we only want mobile's react (v19)
  new RegExp(`^${escapeRegExp(path.resolve(workspaceRoot, 'node_modules/react'))}(/.*)?$`),
  new RegExp(`^${escapeRegExp(path.resolve(workspaceRoot, 'node_modules/react-dom'))}(/.*)?$`),
  // Block nested react-native inside third-party packages (e.g. react-native-calendars)
  // These cause codegen crashes due to version mismatch
  /.*\/node_modules\/.*\/node_modules\/react-native\/.*/,
];

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = config;
