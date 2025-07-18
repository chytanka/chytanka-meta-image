module.exports = {
  dev: process.env.NODE_ENV === 'dev',
  port: process.env.PORT || 3000,
  host: 'http://localhost',
  cacheCleanupInterval: 1000 * 60 * 60
};