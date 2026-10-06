#!/usr/bin/env node

/**
 * My Nintendo Store Wishlist Sync
 *
 * The store wishlist is the source of truth for wanted Nintendo merchandise. It needs a
 * signed-in session, so it is read from the automation Chrome over CDP.
 *
 * Usage:
 *   node scripts/sync/nintendo.js
 */

const fs = require('fs');
const path = require('path');
const { evalInNewTab } = require('./cdp');

const ORIGIN = 'https://store.nintendo.com';
const WISHLIST_URL = `${ORIGIN}/en-gb/account/wishlist`;
const OUTPUT_FILE = path.join(__dirname, '..', '..', 'data', 'sources', 'nintendo.json');
const LOAD_WAIT_MS = 12000;

const PAGE_SCRIPT = `(async () => {
  window.scrollTo(0, document.body.scrollHeight);
  await new Promise(resolve => setTimeout(resolve, 2500));
  const count = document.body.innerText.match(/(\\d+) items?/);
  const removeButtons = [...document.querySelectorAll('main button, main a')].filter(el => el.textContent.trim().toUpperCase() === 'REMOVE');
  const items = removeButtons.map(button => {
    const card = button.closest('div.relative');
    const lines = card.innerText.split('\\n').map(line => line.trim()).filter(Boolean);
    const link = [...card.querySelectorAll('a[href]')].find(a => /\\d{6,}$/.test(a.getAttribute('href')));
    const img = [...card.querySelectorAll('img')].find(el => !el.src.includes('/icons/'));
    const outOfStock = lines.includes('Out of stock');
    const titles = lines.filter(line => !line.startsWith('£') && !/^(REMOVE|VIEW PRODUCT|Out of stock|NINTENDO)$/i.test(line));
    return {
      name: titles[0],
      price: lines.find(line => line.startsWith('£')) || '',
      status: outOfStock ? 'Out of stock' : '',
      href: link ? link.getAttribute('href') : '',
      img: img ? (img.currentSrc || img.src) : ''
    };
  });
  return JSON.stringify({ expected: count ? Number(count[1]) : 0, items });
})()`;

async function main() {
  const page = await evalInNewTab(WISHLIST_URL, PAGE_SCRIPT, LOAD_WAIT_MS);
  if (page.items.length === 0) {
    throw new Error('0 items parsed — signed out or markup changed, snapshot not written');
  }
  if (page.items.length !== page.expected) {
    throw new Error(`parsed ${page.items.length} items but the page says ${page.expected}, snapshot not written`);
  }
  const items = page.items.map(item => ({
    id: (item.href.match(/(\d{6,})$/) || ['', item.name])[1].replace(/^0+/, ''),
    name: item.name,
    price: item.price,
    status: item.status,
    img: item.img,
    url: item.href ? ORIGIN + item.href : ''
  }));
  console.log(`[NintendoSync] ${items.length} wishlist items`);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ scrapedAt: new Date().toISOString(), url: WISHLIST_URL, wishlist: items }, null, 2) + '\n');
  console.log(`[NintendoSync] Wrote ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error(`[NintendoSync] ${err.message.split('\n')[0]}`);
  process.exit(1);
});
