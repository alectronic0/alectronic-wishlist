#!/usr/bin/env node

/**
 * Shop.app Wishlist & Order History Sync
 *
 * Scrapes saved items and past order history from Shop.app over CDP.
 * Supports fallback ingestion from /home/alectronic/ShopApp_Full_Export.json.
 *
 * Usage:
 *   node scripts/sync/shop.js
 *   node scripts/sync/shop.js --from-export <path>
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { evalInNewTab } = require('./cdp');

const SAVED_URL = 'https://shop.app/account/saved';
const ORDERS_URL = 'https://shop.app/account/orders';
const OUTPUT_FILE = path.join(__dirname, '..', '..', 'data', 'shop_items.json');
const DEFAULT_EXPORT = path.join(os.homedir(), 'ShopApp_Full_Export.json');
const LOAD_WAIT_MS = 10000;

const SAVED_SCRIPT = `(async () => {
  if (location.pathname.includes('/login') || location.pathname.includes('/auth')) {
    return JSON.stringify({ error: 'Signed out of Shop.app in Automation profile' });
  }

  // Scroll to load saved cards
  for (let i = 0; i < 5; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 1200));
  }

  const items = [];
  const seen = new Set();
  const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));

  for (const a of links) {
    const url = a.href;
    if (seen.has(url)) continue;
    const img = a.querySelector('img');
    const text = a.innerText.split('\\n').map(s => s.trim()).filter(Boolean);
    
    let merchant = text[0] || '';
    let title = text[1] || text[0] || 'Saved Item';
    let price = text.find(l => /^[£$€]\\d+/.test(l)) || '';

    seen.add(url);
    const productId = url.split('/products/')[1]?.split('?')[0]?.replace(/\\//g, '-') || ('saved-' + items.length);
    items.push({
      id: productId,
      name: title,
      merchant: merchant,
      price: price || 'View on Store',
      url: url,
      img: img ? (img.currentSrc || img.src) : '',
      notes: merchant ? ('Saved from ' + merchant) : 'Saved on Shop.app',
      category: 'saved'
    });
  }
  return JSON.stringify({ count: items.length, items: items });
})()`;

const ORDERS_SCRIPT = `(async () => {
  if (location.pathname.includes('/login') || location.pathname.includes('/auth')) {
    return JSON.stringify({ error: 'Signed out of Shop.app in Automation profile' });
  }

  for (let i = 0; i < 5; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 1200));
  }

  const orders = [];
  const orderCards = Array.from(document.querySelectorAll('div[data-order-id], a[href*="/orders/"], div[role="button"]:has(span)'));
  
  for (const card of orderCards) {
    const text = card.innerText || '';
    const lines = text.split('\\n').map(s => s.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const dateMatch = text.match(/(?:Ordered|Placed|Date):?\\s*([A-Za-z0-9, ]+?)(?:\\n|$)/i);
    const priceMatch = text.match(/[£$€]\\d+(?:\\.\\d{2})?/);

    orders.push({
      merchant: lines[0],
      title: lines[1],
      price: priceMatch ? priceMatch[0] : '',
      date: dateMatch ? dateMatch[1].trim() : ''
    });
  }
  return JSON.stringify({ count: orders.length, orders: orders });
})()`;

function loadExportFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(raw)) return null;

    const orders = [];
    for (const entry of raw) {
      if (!entry.items) continue;
      const titles = entry.items.split(' | ').map(t => t.trim()).filter(Boolean);
      for (const title of titles) {
        orders.push({
          type: entry.type || 'Shopify Order',
          merchant: entry.merchant || '',
          name: title,
          orderDate: entry.date ? entry.date.slice(0, 10) : '',
          price: entry.price || '',
          url: entry.url || '',
          trackingUrl: entry.trackingUrl || ''
        });
      }
    }
    return orders;
  } catch (err) {
    console.warn(`[ShopSync] Warning reading ${filePath}: ${err.message}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const exportIdx = args.indexOf('--from-export');
  const exportFile = exportIdx !== -1 && args[exportIdx + 1] ? path.resolve(args[exportIdx + 1]) : DEFAULT_EXPORT;

  let existing = { collections: { Stuff: [] }, saved: [], orders: [] };
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    } catch (e) {}
  }

  let savedItems = existing.saved || [];
  let orderItems = existing.orders || [];

  // 1. Try CDP scrape
  if (!args.includes('--only-export')) {
    try {
      console.log(`[ShopSync] Checking CDP saved items at ${SAVED_URL}...`);
      const savedRes = await evalInNewTab(SAVED_URL, SAVED_SCRIPT, LOAD_WAIT_MS);
      if (!savedRes.error && savedRes.items) {
        console.log(`[ShopSync] Scraped ${savedRes.items.length} saved items`);
        savedItems = savedRes.items;
      }

      console.log(`[ShopSync] Checking CDP orders at ${ORDERS_URL}...`);
      const orderRes = await evalInNewTab(ORDERS_URL, ORDERS_SCRIPT, LOAD_WAIT_MS);
      if (!orderRes.error && orderRes.orders && orderRes.orders.length > 0) {
        console.log(`[ShopSync] Scraped ${orderRes.orders.length} orders over CDP`);
      }
    } catch (err) {
      console.warn(`[ShopSync] CDP scrape unavailable: ${err.message}`);
    }
  }

  // 2. Ingest manual export if available
  const exportedOrders = loadExportFile(exportFile);
  if (exportedOrders && exportedOrders.length > 0) {
    console.log(`[ShopSync] Ingested ${exportedOrders.length} order items from ${exportFile}`);
    orderItems = exportedOrders;
  }

  const result = {
    scrapedAt: new Date().toISOString(),
    collections: existing.collections || { Stuff: [] },
    saved: savedItems,
    orders: orderItems
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2) + '\n');
  console.log(`[ShopSync] Successfully written ${savedItems.length} saved & ${orderItems.length} orders to ${OUTPUT_FILE}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error(`[ShopSync] ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main };
