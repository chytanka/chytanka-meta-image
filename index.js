const scheduleCacheCleanup = require('./utils/schedule-cache-cleanup');
const { createCacheFolder } = require('./utils/cache');
const { cacheCleanupInterval } = require('./config');
const { startServer } = require('./start-server');

// 🗂 Ensure cache directory exists
createCacheFolder();

// 🧹 Schedule automatic cache cleanup based on config interval
scheduleCacheCleanup(cacheCleanupInterval);

// 🚀 Launch the Express server
startServer();