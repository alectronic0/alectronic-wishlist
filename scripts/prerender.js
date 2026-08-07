const puppeteer = require('puppeteer');
const fs = require('fs');
const http = require('http');
const path = require('path');

const requestHandler = (request, response) => {
  let filePath = '.' + request.url;
  if (filePath == './') filePath = './index.html';
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpg',
    '.svg': 'image/svg+xml', '.webp': 'image/webp'
  };
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code == 'ENOENT' ? 404 : 500);
      response.end();
    } else {
      response.writeHead(200, { 'Content-Type': contentType });
      response.end(content, 'utf-8');
    }
  });
};

const server = http.createServer(requestHandler);

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`Server running at http://localhost:${port}/`);
  
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    await page.evaluateOnNewDocument(() => {
      window.gtag = function() {};
    });

    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    
    await page.evaluate(() => {
      const cc = document.getElementById('cc-main');
      if (cc) cc.remove();
    });
    
    let html = await page.content();
    fs.writeFileSync('index.html', html);
    console.log('Successfully pre-rendered index.html');
    
    await browser.close();
    server.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
