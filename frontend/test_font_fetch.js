const http = require('http');

const url = 'http://localhost:5173/fonts/AdventPro-ExtraBold.ttf';

console.log(`Fetching ${url}...`);

http.get(url, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('Headers:', res.headers);

    let data = [];
    res.on('data', (chunk) => {
        data.push(chunk);
        // Only verify first 100 bytes
        if (Buffer.concat(data).length > 100) {
            res.destroy();
        }
    });

    res.on('end', () => {
        // This probably won't be called due to destroy(), but handling closure
        processResponse(Buffer.concat(data));
    });

    res.on('close', () => {
        processResponse(Buffer.concat(data));
    });

}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});

function processResponse(buffer) {
    const start = buffer.slice(0, 100).toString('utf8');
    console.log('--- START OF CONTENT ---');
    console.log(start);
    console.log('--- END OF CONTENT ---');

    if (start.includes('<!DOCTYPE html>') || start.includes('<html')) {
        console.error('ERROR: Received HTML content instead of font binary!');
    } else {
        console.log('SUCCESS: Received binary content (likely font).');
    }
}
