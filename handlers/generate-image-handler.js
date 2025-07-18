const fs = require('fs');
const  Base64  = require('../utils/base64'); // імпортуй свій base64-хелпер
const { getCacheFileName, saveToCache } = require('../utils/cache'); // імпортуй кеш-функції
const { drawImage } = require('../utils/draw'); // імпортуй drawImage

async function generateImageHandler(req, res) {
    const { src, jsonparams, format } = req.params
    const imageUrl = Base64.isBase64(src) ? Base64.fromBase64(src) : src;

    let params;
    try {
        params = JSON.parse(Base64.fromBase64(jsonparams));
    } catch (err) {
        return res.status(400).send('Invalid JSON parameters');
    }

    const { title, author, copyright } = params;

    if (!imageUrl || !title) {
        return res.status(400).send('Missing imageUrl or text parameter');
    }

    const allowedFormats = ['png', 'jpg', 'jpeg', 'webp'];
    if (!allowedFormats.includes(format.toLowerCase())) {
        return res.status(400).send('Unsupported image format');
    }

    const cachePath = getCacheFileName(imageUrl, title, author, copyright, format);

    if (fs.existsSync(cachePath))
        return res.sendFile(cachePath);

    let buffer;
    try {
        buffer = await drawImage(imageUrl, title, author, copyright, format);
    } catch (err) {
        console.error('drawImage failed:', err);
        return res.status(500).send('Image generation error');
    }

    try {
        saveToCache(cachePath, buffer);
        res.setHeader('Content-Type', `image/${format}`)
            .send(buffer);

    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).send('Failed to generate image');
    }
}

module.exports = { generateImageHandler };
