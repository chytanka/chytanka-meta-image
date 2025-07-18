const { cleanupOldCache, cleanupCacheSize } = require('./cache');
module.exports = (interval) => {
  setInterval(() => {
    cleanupOldCache();
    cleanupCacheSize();
  }, interval);
};