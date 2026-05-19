import util from 'util';

// Hook Node's utility functions into the global scope.
// This allows browser-targeted pure-JS ESM bundles to run flawlessly inside Node.js ESM.
global.util = util;
global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;
