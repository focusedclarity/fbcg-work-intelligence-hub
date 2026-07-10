const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'projects', 'facilities-inspection-dashboard');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.csv': 'text/csv', '.json': 'application/json' };
http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(root, urlPath === '/' ? 'dashboard-2026H1.html' : urlPath);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    const type = types[path.extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type.startsWith('text/') ? type + '; charset=utf-8' : type });
    res.end(data);
  });
}).listen(8642, () => console.log('serving on http://localhost:8642'));
