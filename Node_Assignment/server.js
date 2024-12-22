const http = require('http');
const fs = require('fs');
const path = require('path');

// Path to items.json file
const dataFilePath = path.join(__dirname, 'items.json');

// Helper function to read data from items.json
const readData = () => {
    if (!fs.existsSync(dataFilePath)) fs.writeFileSync(dataFilePath, '[]');
    const data = fs.readFileSync(dataFilePath);
    return JSON.parse(data);
};

// Helper function to write data to items.json
const writeData = (data) => {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

// Web Server & API Server
const server = http.createServer((req, res) => {
    const { url, method } = req;

    // Serve index.html
    if (url === '/' || url === '/index.html') {
        const filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            }
        });
    }

    // 404 for invalid HTML paths
    else if (url.endsWith('.html')) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Page Not Found');
    }

    // API Server
    else if (url.startsWith('/api/items')) {
        let body = '';

        // Collect data from request
        req.on('data', chunk => { body += chunk; });

        req.on('end', () => {
            let items = readData();

            // GET all items
            if (url === '/api/items' && method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(items));
            }

            // GET one item by id
            else if (url.match(/\/api\/items\/\d+/) && method === 'GET') {
                const id = parseInt(url.split('/').pop());
                const item = items.find(i => i.id === id);

                if (item) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(item));
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Item Not Found');
                }
            }

            // POST: Create a new item
            else if (url === '/api/items' && method === 'POST') {
                const newItem = JSON.parse(body);
                newItem.id = items.length ? items[items.length - 1].id + 1 : 1;
                items.push(newItem);node
                writeData(items);

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newItem));
            }

            // PUT: Update an existing item
            else if (url.match(/\/api\/items\/\d+/) && method === 'PUT') {
                const id = parseInt(url.split('/').pop());
                const index = items.findIndex(i => i.id === id);

                if (index !== -1) {
                    const updatedItem = { ...items[index], ...JSON.parse(body) };
                    items[index] = updatedItem;
                    writeData(items);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(updatedItem));
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Item Not Found');
                }
            }

            // DELETE: Remove an item by id
            else if (url.match(/\/api\/items\/\d+/) && method === 'DELETE') {
                const id = parseInt(url.split('/').pop());
                const newItems = items.filter(i => i.id !== id);

                if (newItems.length !== items.length) {
                    writeData(newItems);
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('Item Deleted');
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Item Not Found');
                }
            }

            // Invalid API endpoint
            else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Invalid API Endpoint');
            }
        });
    }

    // Handle invalid paths
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Not Found');
    }
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
