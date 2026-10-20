#!/usr/bin/env node

/**
 * Etsy Favourites & Wishlist Sync
 *
 * Pulls favourited items from Alec's signed-in Etsy account over CDP.
 * Performs progressive scrolling to overcome Etsy's viewport virtualization
 * (which previously cut off at ~13 items).
 *
 * Usage:
 *   node scripts/sync/etsy.js
 *   node scripts/sync/etsy.js --from-export <file>
 */

const fs = require('fs');
const path = require('path');
const { evalInNewTab } = require('./cdp');

const FAVOURITES_URL = 'https://www.etsy.com/your/shops/favorites?tab=items';
const OUTPUT_FILE = path.join(__dirname, '..', '..', 'data', 'sources', 'etsy.json');
const LOAD_WAIT_MS = 10000;

const SCRAPE_SCRIPT = `(async () => {
  if (document.querySelector('form#join-neu-form') || location.pathname.includes('/signin')) {
    return JSON.stringify({ error: 'Signed out of Etsy in Automation profile' });
  }

  // Progressive scrolling to trigger lazy loading of favourited cards
  let previousItemCount = 0;
  for (let scrollAttempt = 0; scrollAttempt < 25; scrollAttempt++) {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 1500));

    const currentCards = document.querySelectorAll('a[href*="/listing/"]');
    if (currentCards.length === previousItemCount && currentCards.length > 0) {
      window.scrollBy(0, -400);
      await new Promise(r => setTimeout(r, 600));
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(r => setTimeout(r, 1200));
      const retryCount = document.querySelectorAll('a[href*="/listing/"]').length;
      if (retryCount === previousItemCount) {
        break;
      }
    }
    previousItemCount = currentCards.length;
  }

  const seen = new Set();
  const items = [];
  const links = Array.from(document.querySelectorAll('a[href*="/listing/"]'));

  for (const a of links) {
    const rawUrl = a.href || '';
    const match = rawUrl.match(/\\/listing\\/(\\d+)/);
    if (!match) continue;
    const listingId = match[1];
    if (seen.has(listingId)) continue;
    seen.add(listingId);

    const card = a.closest('div.js-merch-stash-check-listing, div[data-palette-listing-card], li') || a.parentElement;
    const imgEl = card ? card.querySelector('img') : a.querySelector('img');
    const titleEl = card ? (card.querySelector('h3, .v2-listing-card__title, [data-test-id="listing-card-title"]') || a) : a;
    
    // Find price text
    let price = '';
    const priceEl = card ? card.querySelector('.currency-value, .n-listing-card__price, [data-test-id="listing-card-price"]') : null;
    if (priceEl) {
      price = priceEl.textContent.trim();
      if (!price.startsWith('£') && !price.startsWith('$')) {
        price = '£' + price;
      }
    } else if (card) {
      const matchPrice = card.innerText.match(/[£$€]\\d+(?:\\.\\d{2})?/);
      if (matchPrice) price = matchPrice[0];
    }

    // Find shop name
    let shopName = '';
    const shopEl = card ? card.querySelector('.v2-listing-card__shop, [data-test-id="shop-name"], p.text-gray-lighter') : null;
    if (shopEl) {
      shopName = shopEl.textContent.trim().replace(/^From\\s+/i, '');
    }

    const title = titleEl ? titleEl.textContent.trim().replace(/\\s+/g, ' ') : '';
    const img = imgEl ? (imgEl.currentSrc || imgEl.src || '') : '';
    const url = 'https://www.etsy.com/uk/listing/' + listingId;

    if (title) {
      items.push({
        id: listingId,
        name: title,
        shopName: shopName,
        price: price,
        img: img,
        url: url
      });
    }
  }

  return JSON.stringify({ count: items.length, items });
})()`;

async function main() {
  const args = process.argv.slice(2);
  const exportIdx = args.indexOf('--from-export');

  if (exportIdx !== -1 && args[exportIdx + 1]) {
    const exportPath = path.resolve(args[exportIdx + 1]);
    console.log(`[EtsySync] Loading from manual export: ${exportPath}`);
    const rawData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    const items = Array.isArray(rawData) ? rawData : (rawData.items || []);
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
      scrapedAt: new Date().toISOString(),
      url: 'manual-export',
      items
    }, null, 2) + '\n');
    console.log(`[EtsySync] Wrote ${items.length} items to ${OUTPUT_FILE}`);
    return;
  }

  console.log(`[EtsySync] Connecting to CDP and opening: ${FAVOURITES_URL}`);
  try {
    const result = await evalInNewTab(FAVOURITES_URL, SCRAPE_SCRIPT, LOAD_WAIT_MS);
    if (result.error) {
      console.warn(`[EtsySync] Note: ${result.error}`);
      if (!fs.existsSync(OUTPUT_FILE)) {
        fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
          scrapedAt: new Date().toISOString(),
          url: FAVOURITES_URL,
          items: [],
          status: result.error
        }, null, 2) + '\n');
      }
      return;
    }

    console.log(`[EtsySync] Scraped ${result.items.length} favourite items`);
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
      scrapedAt: new Date().toISOString(),
      url: FAVOURITES_URL,
      items: result.items
    }, null, 2) + '\n');
    console.log(`[EtsySync] Wrote ${OUTPUT_FILE}`);
  } catch (err) {
    console.error(`[EtsySync] CDP extraction warning: ${err.message}`);
    if (!fs.existsSync(OUTPUT_FILE)) {
      fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
        scrapedAt: new Date().toISOString(),
        url: FAVOURITES_URL,
        items: []
      }, null, 2) + '\n');
    }
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(`[EtsySync] ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main };
