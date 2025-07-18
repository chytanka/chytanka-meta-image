const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const DIR = '../.cache';

function getCacheFileName(imageUrl, title, author, copyright, format) {
    const hash = crypto
        .createHash('sha1')
        .update(imageUrl + title + author + copyright)
        .digest('hex');
    return path.join(__dirname, DIR, `${hash}.${format}`);
}

function saveToCache(filePath, buffer) {
    fs.writeFileSync(filePath, buffer);
}

function cleanupOldCache(maxAgeMs = 1000 * 60 * 60 * 24) { // 1 day
    const cacheDir = path.join(__dirname, DIR);
    const files = fs.readdirSync(cacheDir);

    const now = Date.now();

    files.forEach(file => {
        const filePath = path.join(cacheDir, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtimeMs > maxAgeMs) {
            fs.unlinkSync(filePath);
        }
    });
}

function cleanupCacheSize(maxSizeBytes = 100 * 1024 * 1024) { // 100MB
    const cacheDir = path.join(__dirname, DIR);
    const files = fs.readdirSync(cacheDir)
        .map(file => {
            const filePath = path.join(cacheDir, file);
            const stats = fs.statSync(filePath);
            return { filePath, size: stats.size, mtime: stats.mtimeMs };
        });

    let totalSize = files.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > maxSizeBytes) {
        files.sort((a, b) => a.mtime - b.mtime);

        for (let file of files) {
            fs.unlinkSync(file.filePath);
            totalSize -= file.size;
            if (totalSize <= maxSizeBytes) break;
        }
    }
}

function createCacheFolder() {
    const cacheDir = path.join(__dirname, DIR);
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }
}

module.exports = {
    getCacheFileName,
    saveToCache,
    cleanupCacheSize,
    cleanupOldCache,
    createCacheFolder
};