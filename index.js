const express = require('express');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const sharp = require('sharp');
const path = require('path');
const app = express();
const culori = require('culori');
const cors = require('cors');

const port = process.env.PORT || 3000;

corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions));
app.use(express.static('public'));

class Base64 {
    static toBase64(input) {
        return btoa(encodeURIComponent(input)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    static fromBase64(input) {
        const paddedInput = input.length % 4 != 0 ? (input + '='.repeat(4 - input.length % 4)) : input;
        const decodedBase64 = paddedInput.replace(/-/g, '+').replace(/_/g, '/');
        return decodeURIComponent(atob(decodedBase64));
    }

    static isBase64(input) {
        const str = input.replace(/=+$/, "")
        try {
            return Base64.toBase64(Base64.fromBase64(str)) === str;
        } catch (err) {
            return false;
        }
    }
}

app.get('/generate-image', async (req, res) => {
    const { imageSrc, text } = req.query;

    const imageUrl = Base64.isBase64(imageSrc) ? Base64.fromBase64(imageSrc) : imageSrc;

    if (!imageUrl || !text) {
        return res.status(400).send('Missing imageUrl or text parameter');
    }

    try {
        registerFont('assets/Troubleside.ttf', { family: 'Troubleside' });

        const image = await dlImage(imageUrl)
        const avarageColor = getAverageColor(image)
        const shadowColor = shiftColor(avarageColor.hex, 60)

        const width = 1200;
        const height = 628;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = avarageColor.hex;
        ctx.fillRect(0, 0, width, height);

        const padding = 50; // Відступ
        const radius = 12; // Радіус заокруглення

        const imgHeight = height - padding * 2;
        const imgWidth = image.width / image.height * imgHeight;



        // Додаємо текст
        const fontSize = 40;
        const lineHeight = fontSize * 1.3;


        ctx.fillStyle = '#000000';
        ctx.font = `bold ${fontSize}px "Troubleside"`;
        ctx.textAlign = 'left';

        const maxTextWidth = width - imgWidth - padding * 3;
        const x = padding
        const y = padding * 2
        wrapText(ctx, text, x, y, maxTextWidth, lineHeight);

        drawImageWithPadding(ctx, image, width, height, padding, radius, shadowColor);

        // Завантажуємо та вставляємо логотип
        const logoSrc = 'assets/logo.svg';
        const logoSize = 96;
        const mdLogoSrc = 'assets/mangadex-logo.svg'
        const mdLogoSize = 96;

        const logoX = padding;
        const logoY = height - logoSize - padding;

        const mdLogoX = padding / 2 + logoX + logoSize;
        const mdLogoY = height - mdLogoSize - padding;

        await grawSvg(ctx, logoSrc, logoSize, logoSize, logoX, logoY)
        await grawSvg(ctx, mdLogoSrc, mdLogoSize, mdLogoSize, mdLogoX, mdLogoY)


        // Відправляємо зображення у відповідь
        res.setHeader('Content-Type', 'image/png');
        canvas.createPNGStream().pipe(res);
    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).send('Failed to generate image');
    }
});

app.listen(port, () => {
    console.log('Server is running on port 3000');
});

async function dlImage(src) {
    const response = await axios({
        url: src,
        responseType: 'arraybuffer'
    });
    const imageBuffer = Buffer.from(response.data, 'binary');
    const image = await loadImage(imageBuffer);

    return image;
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lines = [];

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = context.measureText(testLine);
        let testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    for (let i = 0; i < lines.length; i++) {
        context.fillText(lines[i], x, y + i * lineHeight);
    }
};

function getAverageColor(img) {
    var canvas = createCanvas('canvas');
    var ctx = canvas.getContext('2d');
    var width = canvas.width = img.naturalWidth;
    var height = canvas.height = img.naturalHeight;

    ctx.drawImage(img, 0, 0);

    var imageData = ctx.getImageData(0, 0, width, height);
    var data = imageData.data;
    var r = 0;
    var g = 0;
    var b = 0;

    for (var i = 0, l = data.length; i < l; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
    }

    r = Math.floor(r / (data.length / 4));
    g = Math.floor(g / (data.length / 4));
    b = Math.floor(b / (data.length / 4));

    return {
        rgb: { r: r, g: g, b: b },
        hex: '#' + ('0' + r.toString(16)).slice(-2) + ('0' + g.toString(16)).slice(-2) + ('0' + b.toString(16)).slice(-2)
    };
}

function shiftColor(hex, h) {
    const colorOklch = culori.oklch(culori.parse(hex));
 
    colorOklch.c = colorOklch.c + 0.025
    colorOklch.l = colorOklch.l - .1
    colorOklch.h = (colorOklch.h + h) % 360;

    const newHexColor = culori.formatHex(colorOklch);
  
    return newHexColor;
}

async function grawSvg(content, svgSrc, w, h, x, y) {
    const logoPath = path.join(__dirname, svgSrc);
    const logoBuffer = await sharp(logoPath).resize(w, h).png().toBuffer();
    const logoImage = await loadImage(logoBuffer);
    content.drawImage(logoImage, x, y, w, h);
}

function drawImageWithPadding(ctx, image, canvasWidth, canvasHeight, padding, radius, shadowColor) {
    const imgHeight = canvasHeight - padding * 2;
    const imgWidth = image.width / image.height * imgHeight;
    const x = canvasWidth - imgWidth - padding;
    const y = (canvasHeight - imgHeight) / 2;

    ctx.save();

    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 10;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + imgWidth, y, x + imgWidth, y + imgHeight, radius);
    ctx.arcTo(x + imgWidth, y + imgHeight, x, y + imgHeight, radius);
    ctx.arcTo(x, y + imgHeight, x, y, radius);
    ctx.arcTo(x, y, x + imgWidth, y, radius);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    ctx.save()
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + imgWidth, y, x + imgWidth, y + imgHeight, radius);
    ctx.arcTo(x + imgWidth, y + imgHeight, x, y + imgHeight, radius);
    ctx.arcTo(x, y + imgHeight, x, y, radius);
    ctx.arcTo(x, y, x + imgWidth, y, radius);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(image, x, y, imgWidth, imgHeight);

    ctx.restore();


};
