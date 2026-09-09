import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const base = path.resolve('dist');
const types = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};
http
  .createServer((req, res) => {
    let file = path.resolve(
      base,
      '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname),
    );
    if (
      !file.startsWith(base + path.sep) ||
      !fs.existsSync(file) ||
      fs.statSync(file).isDirectory()
    )
      file = path.join(base, 'index.html');
    res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  })
  .listen(8081, '0.0.0.0', () => console.log('Miamatch test preview: http://localhost:8081'));
