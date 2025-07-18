const { dev, port, host } = require('../config');

function listenHandler() {
console.log(`Chytanka Meta Image listening at ${host}:${port}`);
        if (dev) require('../generate-test-link')(host, port);
}

module.exports = listenHandler