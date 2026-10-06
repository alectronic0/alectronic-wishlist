#!/usr/bin/env node

/**
 * BoardGameGeek Collection Sync
 *
 * BGG is the source of truth for board games. Its API needs a token and plain requests hit
 * Cloudflare, so the public collection page is read from the automation Chrome over CDP.
 *
 * Usage:
 *   node scripts/sync/bgg.js
 */

const fs = require('fs');
const path = require('path');
const { evalInNewTab } = require('./cdp');

const USER = 'alectronic0';
const COLLECTION_URL = `https://boardgamegeek.com/collection/user/${USER}`;
const OUTPUT_FILE = path.join(__dirname, '..', '..', 'data', 'sources', 'bgg.json');

const CONTENT_FILE = path.join(__dirname, '..', '..', 'js', 'content.js');

// Games on the site with a BGG id but outside the BGG collection still get their cover from BGG
function siteGameIds() {
  global.window = {};
  require(CONTENT_FILE);
  const { owned, wishlist } = global.window.SITE_CONTENT.boardgames;
  return [...owned, ...wishlist].map(game => String(game.bggId || '')).filter(Boolean);
}

const pageScript = extraIds => `(async () => {
  const paging = document.body.innerText.match(/(\\d+) to (\\d+) of (\\d+)/);
  const items = [...document.querySelectorAll('tr[id^="row_"]')].map(row => {
    const link = row.querySelector('.collection_objectname a');
    const href = link.getAttribute('href').split('/');
    const status = row.querySelector('.collection_status');
    return {
      id: href[2],
      type: href[1],
      name: link.textContent.trim(),
      status: status ? status.innerText.replace(/\\s+/g, ' ').trim() : ''
    };
  });
  // Cover URLs are signed, so they cannot be built from the id: ask BGG's own item endpoint
  const cover = async id => {
    const res = await fetch('/api/geekitems?objecttype=thing&objectid=' + id);
    const body = res.ok ? await res.json() : {};
    return (body.item && body.item.imageurl) || '';
  };
  for (const item of items) {
    item.img = await cover(item.id);
  }
  const extraCovers = {};
  for (const id of ${JSON.stringify(extraIds)}.filter(extra => !items.some(item => item.id === extra))) {
    extraCovers[id] = await cover(id);
  }
  return JSON.stringify({ shown: paging ? Number(paging[2]) : 0, total: paging ? Number(paging[3]) : 0, items, extraCovers });
})()`;

async function main() {
  const page = await evalInNewTab(COLLECTION_URL, pageScript(siteGameIds()));
  if (page.items.length === 0) {
    throw new Error('0 items parsed — blocked or markup changed, snapshot not written');
  }
  if (page.shown !== page.total) {
    throw new Error(`collection is paginated (${page.shown} of ${page.total}) — add paging before trusting this snapshot`);
  }
  const items = page.items.map(item => ({
    ...item,
    owned: item.status.includes('Owned'),
    url: `https://boardgamegeek.com/${item.type}/${item.id}`
  }));
  console.log(`[BggSync] ${items.length} items, ${items.filter(item => item.owned).length} owned`);
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ scrapedAt: new Date().toISOString(), url: COLLECTION_URL, items, extraCovers: page.extraCovers }, null, 2) + '\n');
  console.log(`[BggSync] Wrote ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error(`[BggSync] ${err.message}`);
  process.exit(1);
});
