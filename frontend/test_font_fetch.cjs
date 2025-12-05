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
        if (Buffer.concat(data).length > 200) {
            res.destroy();
        }
    });

    res.on('end', () => {
        // Usually not called due to destroy
        // But if small file, maybe.
    });

    res.on('close', () => {
        // Process what we have
        processResponse(Buffer.concat(data));
    });

}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});

function processResponse(buffer) {
    if (buffer.length === 0) {
        console.log('No data received.');
        return;
    }

    const start = buffer.slice(0, 200).toString('utf8');
    console.log('--- START OF CONTENT (Top 200 bytes) ---');
    // Sanitize output for log
    console.log(start.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
    console.log('--- END OF CONTENT ---');

    if (start.includes('<!DOCTYPE html>') || start.includes('<html')) {
        console.error('ERROR: Received HTML content instead of font binary!');
    } else {
        console.log('SUCCESS: Received binary content (likely font).');
        // Check for font magic numbers potentially? 
        // TTF usually starts with ... specific bytes but binary check is enough vs HTML
    }
}
