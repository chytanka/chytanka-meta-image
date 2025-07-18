const { generateImageHandler } = require('./handlers/generate-image-handler');
const listenHandler = require('./handlers/listen-handler')
const { port } = require('./config');
const express = require('express');
const cors = require('cors');

function startServer() {
    const app = express();

    // 🌐 Enable CORS with configured options
    app.use(cors(require('./config/cors')));

    // 📁 Serve static files from 'assets' folder
    app.use(express.static('assets'));

    // 🎨 Handle image generation requests
    app.get('/:src/:jsonparams.:format', generateImageHandler);

    // 🚀 Start server and call listenHandler on successful launch
    app.listen(port, '127.0.0.1', listenHandler);
}

module.exports = { startServer };