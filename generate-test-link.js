const Base64 = require('./utils/base64');

const imageLink = 'https://mangadex.org/covers/0fbd2588-99c2-4900-9c17-96b034a82557/6f4643bd-2ee8-4735-9b01-e2d2bb42d1a9.jpg.512.jpg';
const data = {
    title: "Псевдогарем",
    author: "Saitou Yuu (斉藤 ゆう)",
    copyright: "mangadex"
}

function generateLocalTestLink(host, port, imageUrl, data) {
    const encodedUrl = Base64.toBase64(imageUrl);
    const encodedData = Base64.toBase64(JSON.stringify(data));
    return `${host}:${port}/${encodedUrl}/${encodedData}`;
}

function logTestLink(host, port) {
    const testLink = generateLocalTestLink(host, port, imageLink, data);
    console.log(testLink + '.webp');
    console.log(testLink + '.png');
    console.log(testLink + '.jpg');
}

module.exports = logTestLink