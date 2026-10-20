#!/usr/bin/env node

/**
 * Amazon Order History Sync
 *
 * Scrapes Alec's past orders from Amazon UK via CDP (signed-in session).
 * Supports fallback/offline ingestion from /home/alectronic/amazon_orders.json.
 *
 * Usage:
 *   node scripts/sync/amazon_orders.js
 *   node scripts/sync/amazon_orders.js --from-export <path>
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { evalInNewTab } = require('./cdp');

const ORDERS_URL = 'https://www.amazon.co.uk/your-orders/orders';
const OUTPUT_FILE = path.join(__dirname, '..', '..', 'data', 'sources', 'amazon_orders.json');
const DEFAULT_EXPORT = path.join(os.homedir(), 'amazon_orders.json');
const LOAD_WAIT_MS = 10000;

const SCRAPE_SCRIPT = `(async () => {
  if (document.querySelector('form[name="signIn"]') || location.pathname.includes('/signin')) {
    return JSON.stringify({ error: 'Signed out of Amazon in Automation profile' });
  }

  const orders = [];
  const cards = Array.from(document.querySelectorAll('.order-card, .js-order-card, div[data-order-id]'));

  for (const card of cards) {
    const orderId = card.getAttribute('data-order-id') || (card.innerText.match(/\\d{3}-\\d{7}-\\d{7}/) || [''])[0];
    
    // Extract Order Placed Date
    let orderPlaced = '';
    const dateMatch = card.innerText.match(/ORDER PLACED\\s*\\n*\\s*([A-Za-z0-9, ]+?)(?:\\n|TOTAL|$)/i);
    if (dateMatch) {
      orderPlaced = dateMatch[1].trim();
    }

    // Extract Total
    let total = '';
    const totalMatch = card.innerText.match(/TOTAL\\s*\\n*\\s*([£$€\\d,.]+)/i);
    if (totalMatch) {
      total = totalMatch[1].trim();
    }

    // Extract items
    const itemLinks = Array.from(card.querySelectorAll('a[href*="/gp/product/"], a[href*="/dp/"]'))
      .filter(a => a.textContent.trim().length > 3 && !a.querySelector('img'));

    const items = [];
    const seenAsins = new Set();

    for (const link of itemLinks) {
      const href = link.href || '';
      const asinMatch = href.match(/\\/(?:dp|product)\\/([A-Z0-9]{10})/i);
      const asin = asinMatch ? asinMatch[1] : '';
      if (asin && seenAsins.has(asin)) continue;
      if (asin) seenAsins.add(asin);

      const itemCard = link.closest('.item-box, .yo-item-detail, .a-fixed-left-grid') || link.parentElement;
      const img = itemCard ? itemCard.querySelector('img') : null;

      items.push({
        asin: asin,
        title: link.textContent.trim().replace(/\\s+/g, ' '),
        url: asin ? 'https://www.amazon.co.uk/dp/' + asin : href,
        img: img ? (img.currentSrc || img.src || '') : ''
      });
    }

    if (items.length > 0) {
      orders.push({
        orderId: orderId,
        orderPlaced: orderPlaced,
        total: total,
        items: items
      });
    }
  }

  return JSON.stringify({ count: orders.length, orders: orders });
})()`;

function parseDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return dateStr;
}

function loadLocalExport(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(raw)) return [];
    
    // Normalize amazon_orders.json format
    const orders = [];
    for (const row of raw) {
      if (!row.orderId || row.orderId === 'TOTALS') continue;
      const titles = (row.itemTitles || '').split(' | ').filter(Boolean);
      orders.push({
        orderId: row.orderId,
        orderPlaced: parseDate(row.orderPlaced),
        total: row.total || '',
        items: titles.map(t => ({
          asin: '',
          title: t,
          url: '',
          img: ''
        }))
      });
    }
    return orders;
  } catch (err) {
    console.warn(`[AmazonOrders] Warning reading local export ${filePath}: ${err.message}`);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const exportIdx = args.indexOf('--from-export');
  const exportFile = exportIdx !== -1 && args[exportIdx + 1] ? path.resolve(args[exportIdx + 1]) : DEFAULT_EXPORT;

  let orders = [];

  // 1. Try CDP extraction
  if (!args.includes('--only-export')) {
    console.log(`[AmazonOrders] Checking CDP at ${ORDERS_URL}...`);
    try {
      const result = await evalInNewTab(ORDERS_URL, SCRAPE_SCRIPT, LOAD_WAIT_MS);
      if (result.error) {
        console.warn(`[AmazonOrders] Note: ${result.error}`);
      } else if (result.orders && result.orders.length > 0) {
        console.log(`[AmazonOrders] Scraped ${result.orders.length} orders over CDP`);
        orders = result.orders.map(o => ({ ...o, orderPlaced: parseDate(o.orderPlaced) }));
      }
    } catch (err) {
      console.warn(`[AmazonOrders] CDP scrape unavailable: ${err.message}`);
    }
  }

  // 2. Ingest/Merge local export
  const localOrders = loadLocalExport(exportFile);
  if (localOrders.length > 0) {
    console.log(`[AmazonOrders] Ingested ${localOrders.length} orders from ${exportFile}`);
    const existingIds = new Set(orders.map(o => o.orderId));
    for (const lo of localOrders) {
      if (!existingIds.has(lo.orderId)) {
        orders.push(lo);
      }
    }
  }

  console.log(`[AmazonOrders] Total orders snapshot: ${orders.length}`);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
    scrapedAt: new Date().toISOString(),
    orders: orders
  }, null, 2) + '\n');
  console.log(`[AmazonOrders] Wrote ${OUTPUT_FILE}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error(`[AmazonOrders] ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main };
