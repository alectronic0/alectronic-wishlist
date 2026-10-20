#!/usr/bin/env node

/**
 * Pokémon Center UK Wishlist & Order History Sync
 *
 * Scrapes Alec's orders and wishlist from Pokémon Center UK over CDP.
 * Supports fallback ingestion from /home/alectronic/pokemon_center_home.json.
 *
 * Usage:
 *   node scripts/sync/pokemon_center.js
 *   node scripts/sync/pokemon_center.js --from-export <path>
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { evalInNewTab } = require('./cdp');

const ORDERS_URL = 'https://www.pokemoncenter.com/en-gb/account/orders';
const WISHLIST_URL = 'https://www.pokemoncenter.com/en-gb/wishlist';
const OUTPUT_FILE = path.join(__dirname, '..', '..', 'data', 'sources', 'pokemon_center.json');
const DEFAULT_EXPORT = path.join(os.homedir(), 'pokemon_center_home.json');
const LOAD_WAIT_MS = 12000;

const SCRAPE_ORDERS_SCRIPT = `(async () => {
  if (location.pathname.includes('/login') || location.pathname.includes('/auth')) {
    return JSON.stringify({ error: 'Signed out of Pokemon Center UK' });
  }

  const orders = [];
  const cards = Array.from(document.querySelectorAll('div[class*="order"], div[class*="OrderCard"]'));

  for (const card of cards) {
    const text = card.innerText || '';
    const dateMatch = text.match(/(?:Ordered|Date):?\\s*([A-Za-z0-9, ]+?)(?:\\n|$)/i);
    const orderIdMatch = text.match(/Order (?:#|number)?:?\\s*([A-Z0-9-]+)/i);

    const items = [];
    const itemLinks = Array.from(card.querySelectorAll('a[href*="/product/"]'));

    for (const link of itemLinks) {
      const name = link.textContent.trim();
      const img = link.querySelector('img') || card.querySelector('img');
      if (name.length > 3) {
        items.push({
          name: name,
          url: link.href,
          img: img ? (img.currentSrc || img.src) : ''
        });
      }
    }

    if (items.length > 0) {
      orders.push({
        orderId: orderIdMatch ? orderIdMatch[1] : '',
        orderDate: dateMatch ? dateMatch[1].trim() : '',
        items: items
      });
    }
  }

  return JSON.stringify({ count: orders.length, orders: orders });
})()`;

function loadExportFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(raw)) return [];
    return raw.map(item => ({
      name: item.title,
      price: item.price || '',
      url: item.href || '',
      img: item.img || '',
      inStock: item.inStock !== false,
      franchise: item.franchise || 'Pokémon'
    }));
  } catch (err) {
    console.warn(`[PokeSync] Warning reading ${filePath}: ${err.message}`);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const exportIdx = args.indexOf('--from-export');
  const exportFile = exportIdx !== -1 && args[exportIdx + 1] ? path.resolve(args[exportIdx + 1]) : DEFAULT_EXPORT;

  let orders = [];
  let wishlist = [];

  // 1. Try CDP scrape
  if (!args.includes('--only-export')) {
    try {
      console.log(`[PokeSync] Checking CDP orders at ${ORDERS_URL}...`);
      const orderRes = await evalInNewTab(ORDERS_URL, SCRAPE_ORDERS_SCRIPT, LOAD_WAIT_MS);
      if (!orderRes.error && orderRes.orders) {
        console.log(`[PokeSync] Scraped ${orderRes.orders.length} orders over CDP`);
        orders = orderRes.orders;
      }
    } catch (err) {
      console.warn(`[PokeSync] CDP scrape unavailable: ${err.message}`);
    }
  }

  // 2. Ingest local export as merchandise/wishlist fallback
  const exportItems = loadExportFile(exportFile);
  if (exportItems.length > 0) {
    console.log(`[PokeSync] Ingested ${exportItems.length} items from ${exportFile}`);
    wishlist = exportItems;
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
    scrapedAt: new Date().toISOString(),
    url: ORDERS_URL,
    orders: orders,
    wishlist: wishlist
  }, null, 2) + '\n');
  console.log(`[PokeSync] Successfully written ${orders.length} orders & ${wishlist.length} wishlist items to ${OUTPUT_FILE}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error(`[PokeSync] ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main };
