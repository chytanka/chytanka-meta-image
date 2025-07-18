const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const sharp = require('sharp');
const path = require('path');
const culori = require('culori');

const Q = .8;

async function drawImage(imageUrl, text, author, copyright, format) {

    registerFont(path.resolve(__dirname, '../assets', 'Troubleside.ttf'), { family: 'Troubleside' });

    const image = await dlImage(imageUrl)

    const avarageColor = getAverageColor(image)
    const shadowColor = shiftColor(avarageColor.hex, 60)

    const width = 1200;
    const height = 628;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = avarageColor.hex;
    ctx.fillRect(0, 0, width, height);

    const padding = 50;
    const radius = 12;

    const imgHeight = height - padding * 2;
    const imgWidth = image.width / image.height * imgHeight;

    const fontSize = 40;
    const lineHeight = fontSize * 1.3;

    const maxTextWidth = width - imgWidth - padding * 3;
    const x = padding
    const y = padding * 1.5

    ctx.font = `20px "Arial"`;
    ctx.fillStyle = isLight(avarageColor.rgb) ? '#444' : "#ccc";
    ctx.fillText(author, x, y)

    // ctx.font = `bold ${fontSize}px "Troubleside"`;
    ctx.font = `${fontSize}px "Troubleside", "Arial", sans-serif`;
    ctx.textAlign = 'left';


    ctx.fillStyle = isLight(avarageColor.rgb) ? '#000000' : "#fff";
    wrapText(ctx, text, x, y + lineHeight, maxTextWidth, lineHeight);

    drawImageWithPadding(ctx, image, width, height, padding, radius, avarageColor.hex, shadowColor);

    const logoSrc = path.resolve(__dirname, '../assets', 'chytanka-128.svg');
    const logoSize = 96;


    const logoX = padding;
    const logoY = height - logoSize - padding;

    await grawSvg(ctx, logoSrc, logoSize, logoSize, logoX, logoY)

    if (copyright) {
        const mdLogoSrc = path.resolve(__dirname, '../assets', `${copyright}-logo.svg`)
        const mdLogoSize = 96;
        const mdLogoX = padding / 2 + logoX + logoSize;
        const mdLogoY = height - mdLogoSize - padding;

        await grawSvg(ctx, mdLogoSrc, mdLogoSize, mdLogoSize, mdLogoX, mdLogoY)
    }


    return await convertCanvasToFormat(canvas, format, Q);

}

async function convertCanvasToFormat(canvas, format = 'webp', quality = Q) {
    const inputBuffer = canvas.toBuffer('image/png');

    const image = sharp(inputBuffer);

    switch (format) {
        case 'jpg':
        case 'jpeg':
            return await image.jpeg({ quality: quality * 100 }).toBuffer();
        case 'png':
            return await image.png().toBuffer();
        case 'webp':
            return await image.webp({ quality: quality * 100 }).toBuffer();
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}


async function dlImage(src) {
    try {
        const response = await axios({
            url: src,
            responseType: 'arraybuffer'
        });
        const imageBuffer = Buffer.from(response.data, 'binary');


        const image = await loadImage(imageBuffer);

        return image;
    } catch (error) {
        console.log(error.name);

    }
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
    const logoPath = path.resolve(__dirname, svgSrc);
    const logoBuffer = await sharp(logoPath).resize(w, h).png().toBuffer();
    const logoImage = await loadImage(logoBuffer);
    content.drawImage(logoImage, x, y, w, h);
}

function drawImageWithPadding(ctx, image, canvasWidth, canvasHeight, padding, radius, surfaceColor, shadowColor) {
    const imgHeight = canvasHeight - padding * 2;
    const imgWidth = image.width / image.height * imgHeight;
    const x = canvasWidth - imgWidth - padding;
    const y = (canvasHeight - imgHeight) / 2;

    const drawRoundedRectPath = () => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + imgWidth, y, x + imgWidth, y + imgHeight, radius);
        ctx.arcTo(x + imgWidth, y + imgHeight, x, y + imgHeight, radius);
        ctx.arcTo(x, y + imgHeight, x, y, radius);
        ctx.arcTo(x, y, x + imgWidth, y, radius);
        ctx.closePath();
    };

    // --- First shadow (shadowColor) ---
    ctx.save();
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 10;
    ctx.shadowOffsetY = 10;

    drawRoundedRectPath();
    ctx.fillStyle = '#0000'; // again, invisible fill just for shadow
    ctx.fill();
    ctx.restore();

    // --- Second shadow (surfaceColor) ---
    ctx.save();
    ctx.shadowColor = surfaceColor;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    drawRoundedRectPath();
    ctx.fillStyle = '#0000'; // transparent, just to trigger the shadow
    ctx.fill();
    ctx.restore();

    // --- Clip + draw image inside rounded rect ---
    ctx.save();
    drawRoundedRectPath();
    ctx.clip();
    ctx.drawImage(image, x, y, imgWidth, imgHeight);
    ctx.restore();
}

function isLight({ r, g, b }) {
    const luminance =
        (0.2126 * r) / 255 +
        (0.7152 * g) / 255 +
        (0.0722 * b) / 255;
    return luminance > 0.5;

}

module.exports = { drawImage }