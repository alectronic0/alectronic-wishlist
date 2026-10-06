#!/usr/bin/env node

/**
 * Amazon Wishlist Sync
 *
 * Amazon is the source of truth; this writes a raw snapshot that the site is rebuilt from.
 *
 * Usage:
 *   node scripts/sync/amazon.js
 */

const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://www.amazon.co.uk';
const OUTPUT_FILE = path.join(__dirname, '..', '..', 'data', 'sources', 'amazon.json');
const MAX_PAGES = 60;
const LISTS = {
  boardgames: '13S66685VZMFC',
  books: '30HD1JLLAIGAF',
  kitchen: '3CXJS9K6IVTSE'
};
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-GB,en;q=0.9'
};

const ENTITIES = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };

function decode(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/g, (match, name) => ENTITIES[name] || match);
}

async function fetchPage(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`GET ${url}: HTTP ${res.status}`);
  }
  return res.text();
}

function parsePrice(tag) {
  const match = tag.match(/data-price="([^"]*)"/);
  if (!match) {
    return null;
  }
  const price = Number(match[1]);
  // Amazon emits "-Infinity" for unavailable items
  return Number.isFinite(price) ? price : null;
}

function parseItems(html) {
  const items = [];
  const pattern = /id="itemName_([A-Z0-9]+)"[^>]*title="([^"]*)"[^>]*href="\/dp\/([A-Z0-9]{10})/g;
  for (const match of html.matchAll(pattern)) {
    const [, itemId, title, asin] = match;
    const rowStart = html.lastIndexOf('<li', match.index);
    const rowTag = html.slice(rowStart, html.indexOf('>', rowStart));
    const rowEnd = html.indexOf('</li>', match.index);
    const row = html.slice(rowStart, rowEnd);
    const byline = html.match(new RegExp(`id="item-byline-${itemId}"[^>]*>\\s*([^<]*)`));
    const img = row.match(/<img[^>]*src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
    items.push({
      asin,
      title: decode(title),
      byline: byline ? decode(byline[1]).trim() : '',
      price: parsePrice(rowTag),
      img: img ? img[1] : '',
      url: `${ORIGIN}/dp/${asin}`
    });
  }
  return items;
}

function nextPageUrl(html) {
  if (html.includes('endOfListMarker')) {
    return null;
  }
  const match = html.match(/name="showMoreUrl"[^>]*value="([^"]+)"/);
  if (!match) {
    return null;
  }
  return ORIGIN + decode(match[1]);
}

async function scrapeList(listId) {
  const byAsin = new Map();
  let name = '';
  let url = `${ORIGIN}/hz/wishlist/ls/${listId}?viewType=list`;
  for (let page = 0; url; page++) {
    if (page >= MAX_PAGES) {
      throw new Error(`${listId}: no end-of-list marker after ${MAX_PAGES} pages`);
    }
    const html = await fetchPage(url);
    const title = html.match(/id="profile-list-name"[^>]*>([^<]*)/);
    if (title) {
      name = decode(title[1]).trim();
    }
    for (const item of parseItems(html)) {
      if (byAsin.has(item.asin)) {
        continue;
      }
      byAsin.set(item.asin, item);
    }
    url = nextPageUrl(html);
  }
  return { id: listId, name, url: `${ORIGIN}/hz/wishlist/ls/${listId}`, items: [...byAsin.values()] };
}

async function main() {
  const lists = {};
  for (const [key, listId] of Object.entries(LISTS)) {
    lists[key] = await scrapeList(listId);
    console.log(`[AmazonSync] ${key} "${lists[key].name}": ${lists[key].items.length} items`);
    if (lists[key].items.length === 0) {
      throw new Error(`${key}: 0 items parsed — blocked or markup changed, snapshot not written`);
    }
  }
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ scrapedAt: new Date().toISOString(), lists }, null, 2) + '\n');
  console.log(`[AmazonSync] Wrote ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error(`[AmazonSync] ${err.message}`);
  process.exit(1);
});
