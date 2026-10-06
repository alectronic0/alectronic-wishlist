#!/usr/bin/env node

/**
 * LEGO Wishlist Sync
 *
 * LEGO.com is the source of truth: the wishlist for wanted sets, My Collection (registered
 * sets) and the order history for owned ones. All three need a signed-in session, so they
 * are read from the automation Chrome over CDP.
 *
 * Usage:
 *   node scripts/sync/lego.js
 */

const fs = require('fs');
const path = require('path');
const { evalInNewTab } = require('./cdp');

// Guest links are the public, shareable form of each wishlist. A list appears to hold 30 sets
// at most, so wanted sets spill over into a second list.
const WISHLIST_URLS = [
  'https://www.lego.com/en-gb/guest/wishlist/e528e377-3adc-49b5-ad36-d93c01dc9466',
  'https://www.lego.com/en-gb/guest/wishlist/09f2ac1f-8b53-4750-a5c4-8050b0e37976'
];
const COLLECTION_URL = 'https://www.lego.com/en-gb/member/collections';
const ORDERS_URL = 'https://www.lego.com/en-gb/member/orders';
const OUTPUT_FILE = path.join(__dirname, '..', '..', 'data', 'sources', 'lego.json');
const LOAD_WAIT_MS = 12000;

// Off-screen cards are not laid out, so innerText is empty for them: read text nodes instead.
// Scoped to the list that follows the wishlist heading; a "recommended" carousel sits below it.
const PAGE_SCRIPT = `(async () => {
  window.scrollTo(0, document.body.scrollHeight);
  await new Promise(resolve => setTimeout(resolve, 2500));
  const heading = document.body.innerText.match(/Wish List \\((\\d+)\\)/);
  const list = document.querySelector('main ul:has(a[href*="/product/"])');
  const items = [...list.children].map(card => {
    const link = card.querySelector('a[href*="/product/"]');
    const texts = [];
    const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent.trim();
      if (text) { texts.push(text); }
    }
    const img = card.querySelector('img[src*="/cdn/cs/set/assets/"]');
    return { href: link ? link.getAttribute('href') : '', img: img ? img.src : '', texts };
  }).filter(item => item.href);
  return JSON.stringify({ expected: heading ? Number(heading[1]) : 0, items });
})()`;

const COLLECTION_SCRIPT = `(() => {
  const count = document.body.innerText.match(/(\\d+)\\nSets/);
  const sets = [...document.querySelectorAll('button[class*="CollectionCard"]')].map(card => {
    const img = card.querySelector('img');
    const added = card.textContent.match(/Added: (.*)$/);
    return { name: img.alt, img: img.src.split('?')[0], added: added ? added[1].trim() : '' };
  });
  return JSON.stringify({ expected: count ? Number(count[1]) : 0, sets });
})()`;

const ORDER_LIST_SCRIPT = `(async () => {
  for (let page = 0; page < 20; page++) {
    const more = [...document.querySelectorAll('button')].find(button => /Load More/i.test(button.textContent));
    if (!more) { break; }
    more.scrollIntoView();
    more.click();
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  const links = [...document.querySelectorAll('a[href*="/member/orders/details/"]')].map(link => link.getAttribute('href'));
  return JSON.stringify([...new Set(links)]);
})()`;

// Only line items are read: the page also shows delivery and billing addresses, and the
// snapshot is published with the site, so order dates are left out too.
const ORDER_SCRIPT = `(() => {
  const main = document.querySelector('main');
  const items = [...main.querySelectorAll('img[src*="/cdn/cs/set/assets/"]')]
    .filter(img => img.closest('a[href*="/product/"]'))
    .map(img => ({ name: img.alt, img: img.src.split('?')[0], href: img.closest('a').getAttribute('href') }));
  return JSON.stringify({ items });
})()`;

const STATUSES = ['Retired Product', 'Out of stock', 'Back order', 'Coming Soon', 'Pre-order', 'Retiring soon'];

function parseItem(raw) {
  const slug = raw.href.split('?')[0].split('/product/')[1];
  // Each price appears twice: once visible, once for screen readers
  const prices = [...new Set(raw.texts.filter(text => /^£[\d,.]+$/.test(text)))];
  const name = raw.texts.find(text => text.length > 3 && !/^[£\d+.\-−%x ]/.test(text) && !/^(Exclusives|New|Retiring soon|Add to Bag|Hard to find)$/.test(text)
    && !STATUSES.includes(text) && !/Points$/.test(text));
  return {
    id: slug.split('-').pop(),
    name: name || slug,
    price: prices[0] || '',
    salePrice: prices[1] || '',
    status: STATUSES.filter(status => raw.texts.includes(status)).join(' / '),
    img: raw.img.split('?')[0],
    url: `https://www.lego.com/en-gb/product/${slug}`
  };
}

// Box-art filenames look like "LEGO_75244_Box1_v29.png" or "bltb9806cd998b56321-72154_Box1_v29.png":
// the set number is the run of digits right before "_Box", not the first digits in the name
function setNumber(filename) {
  const match = filename.match(/(\d{4,7})_box/i);
  return match ? match[1] : '';
}

async function readCollection() {
  const page = await evalInNewTab(COLLECTION_URL, COLLECTION_SCRIPT, LOAD_WAIT_MS);
  if (page.sets.length !== page.expected) {
    throw new Error(`collection: parsed ${page.sets.length} sets but the page says ${page.expected}, snapshot not written`);
  }
  return page.sets.map(set => ({ id: setNumber(set.img.split('/').pop()), ...set }));
}

async function readOrders() {
  const links = await evalInNewTab(ORDERS_URL, ORDER_LIST_SCRIPT, LOAD_WAIT_MS);
  const orders = [];
  for (const link of links) {
    const order = await evalInNewTab(`https://www.lego.com${link}`, ORDER_SCRIPT, LOAD_WAIT_MS);
    orders.push({
      items: order.items.map(item => {
        const slug = item.href.split('?')[0].split('/product/')[1];
        return { id: slug.split('-').pop(), name: item.name, img: item.img, url: `https://www.lego.com/en-gb/product/${slug}` };
      })
    });
  }
  return orders;
}

async function readWishlist(url) {
  const page = await evalInNewTab(url, PAGE_SCRIPT, LOAD_WAIT_MS);
  const items = page.items.map(parseItem);
  if (items.length === 0) {
    throw new Error(`${url}: 0 items parsed — markup changed or list empty, snapshot not written`);
  }
  // Only the default list prints its count in the heading
  if (page.expected && items.length !== page.expected) {
    throw new Error(`${url}: parsed ${items.length} items but the page says ${page.expected}, snapshot not written`);
  }
  return items;
}

async function main() {
  const byId = new Map();
  for (const url of WISHLIST_URLS) {
    for (const item of await readWishlist(url)) {
      byId.set(item.id, item);
    }
  }
  const items = [...byId.values()];
  const collection = await readCollection();
  const orders = await readOrders();
  console.log(`[LegoSync] ${items.length} wishlist items, ${collection.length} registered sets, ${orders.length} orders`);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ scrapedAt: new Date().toISOString(), urls: WISHLIST_URLS, wishlist: items, collection, orders }, null, 2) + '\n');
  console.log(`[LegoSync] Wrote ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error(`[LegoSync] ${err.message.split('\n')[0]}`);
  process.exit(1);
});
