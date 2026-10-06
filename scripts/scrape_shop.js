#!/usr/bin/env node

/**
 * Shop.app Scraper & Wishlist Importer
 * 
 * Usage:
 *   1. Scrape public collection:
 *      node scripts/scrape_shop.js --collection "https://shop.app/collections/l_PLd5J17ruDGnoBTqXdNsjuLX--yKE2sdJTzPxyUwcwboXjWdNP"
 * 
 *   2. Interactive login & scrape saved items:
 *      node scripts/scrape_shop.js --saved --interactive
 * 
 *   3. Parse from saved HTML dump:
 *      node scripts/scrape_shop.js --saved-html ./saved_dump.html
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const COLLECTION_URL_DEFAULT = 'https://shop.app/collections/l_PLd5J17ruDGnoBTqXdNsjuLX--yKE2sdJTzPxyUwcwboXjWdNP';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'shop_items.json');

async function launchBrowser(interactive = false) {
  return await puppeteer.launch({
    headless: interactive ? false : 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  });
}

async function scrapeCollection(url = COLLECTION_URL_DEFAULT) {
  console.log(`[ShopScraper] Fetching collection: ${url}`);
  const browser = await launchBrowser(false);
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  const collectionData = await page.evaluate(() => {
    const headerTitle = document.querySelector('h1')?.innerText?.trim() || 'Stuff';
    
    const productLinks = Array.from(document.querySelectorAll('a[href*="/products/"]'));
    const seen = new Set();
    const items = [];

    for (const a of productLinks) {
      const url = a.href;
      if (seen.has(url)) continue;
      
      const card = a.closest('div') || a;
      const img = a.querySelector('img') || card.querySelector('img');
      const textLines = a.innerText.split('\n').map(s => s.trim()).filter(Boolean);

      let merchant = '';
      let title = '';
      let price = '';
      let notes = '';

      if (textLines.length >= 2) {
        merchant = textLines[0];
        title = textLines[1];
        const priceLine = textLines.find(l => /^[£$€]\d+/.test(l));
        if (priceLine) price = priceLine;
        
        const extraLines = textLines.filter(l => l !== merchant && l !== title && l !== price && !/^\(\d+\)$/.test(l));
        if (extraLines.length > 0) {
          notes = extraLines.join(' | ');
        }
      } else if (textLines.length === 1) {
        title = textLines[0];
      }

      if (title) {
        seen.add(url);
        const productId = url.split('/products/')[1]?.split('?')[0]?.replace(/\//g, '-') || `shop-${items.length}`;
        items.push({
          id: productId,
          name: title,
          merchant: merchant,
          price: price || 'View on Store',
          url: url,
          img: img ? img.src : '',
          notes: notes ? `${merchant ? `${merchant} — ` : ''}${notes}` : (merchant ? `By ${merchant}` : ''),
          category: 'stuff'
        });
      }
    }

    return {
      title: headerTitle,
      items: items
    };
  });

  await browser.close();
  console.log(`[ShopScraper] Extracted ${collectionData.items.length} items from collection "${collectionData.title}".`);
  return collectionData;
}

async function scrapeSavedInteractive() {
  console.log(`[ShopScraper] Launching interactive browser for https://shop.app/account/saved`);
  console.log(`[ShopScraper] Please log into your Shop account in the opened window...`);
  
  const browser = await launchBrowser(true);
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('https://shop.app/account/saved', { waitUntil: 'networkidle2' });

  console.log(`[ShopScraper] Waiting for saved items to load. Press Enter in terminal when logged in and viewing items.`);
  
  await new Promise(resolve => {
    process.stdin.once('data', () => resolve());
  });

  const savedItems = await page.evaluate(() => {
    const items = [];
    const seen = new Set();
    const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));

    for (const a of links) {
      const url = a.href;
      if (seen.has(url)) continue;
      const img = a.querySelector('img');
      const text = a.innerText.split('\n').map(s => s.trim()).filter(Boolean);
      
      let merchant = text[0] || '';
      let title = text[1] || text[0] || 'Saved Item';
      let price = text.find(l => /^[£$€]\d+/.test(l)) || '';

      seen.add(url);
      const productId = url.split('/products/')[1]?.split('?')[0]?.replace(/\//g, '-') || `saved-${items.length}`;
      items.push({
        id: productId,
        name: title,
        merchant: merchant,
        price: price || 'View on Store',
        url: url,
        img: img ? img.src : '',
        notes: merchant ? `Saved from ${merchant}` : 'Saved on Shop.app',
        category: 'saved'
      });
    }
    return items;
  });


  await browser.close();
  console.log(`[ShopScraper] Extracted ${savedItems.length} saved items.`);
  return savedItems;
}

async function main() {
  const args = process.argv.slice(2);
  let collectionUrl = COLLECTION_URL_DEFAULT;
  let runSaved = false;
  let isInteractive = false;

  if (args.includes('--saved')) {
    runSaved = true;
  }
  if (args.includes('--interactive')) {
    isInteractive = true;
  }
  const colIdx = args.indexOf('--collection');
  if (colIdx !== -1 && args[colIdx + 1]) {
    collectionUrl = args[colIdx + 1];
  }

  const results = {
    scrapedAt: new Date().toISOString(),
    collections: {},
    saved: []
  };

  if (runSaved && isInteractive) {
    results.saved = await scrapeSavedInteractive();
  }

  const collectionData = await scrapeCollection(collectionUrl);
  results.collections[collectionData.title] = collectionData.items;

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`[ShopScraper] Successfully written output to ${OUTPUT_FILE}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('[ShopScraper] Error:', err);
    process.exit(1);
  });
}

module.exports = { scrapeCollection, scrapeSavedInteractive };
