#!/usr/bin/env node

/**
 * Image Finder
 *
 * Looks up a product picture on Amazon UK for every card that has none, for items that no
 * synced source covers (hand-entered owned items mostly).
 *
 * A search often returns the wrong product (a different model, an accessory, a bundle), so
 * nothing is applied automatically. Each item gets its top search results as "options" in
 * data/image_candidates.json; set "pick" to the index of the right one, or change "query"
 * and run again to search with different words. Only picked options reach js/content.js.
 *
 * Usage:
 *   node scripts/find_images.js            # Amazon search for items that have no options yet
 *   node scripts/find_images.js --pages    # read the picture from each item's own product page
 *   node scripts/find_images.js --apply    # copy picked options into js/content.js
 *
 * --pages opens each link in a headless Chrome (CHROME_PATH, default /usr/bin/google-chrome-stable):
 * shops answer plain requests with 429/403. It also records the HTTP status, so it doubles as a
 * link check for those shops.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_FILE = path.join(ROOT, 'js', 'content.js');
const CANDIDATES_FILE = path.join(ROOT, 'data', 'image_candidates.json');
const SEARCH_URL = 'https://www.amazon.co.uk/s?k=';
const OPTIONS_KEPT = 4;
const PAUSE_MS = 1200;
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-GB,en;q=0.9'
};
const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'and', 'to', 'in', 'for', 'with', 'by', 'edition', 'series']);

function loadContent() {
  global.window = {};
  require(CONTENT_FILE);
  return global.window.SITE_CONTENT;
}

function saveContent(content) {
  const json = JSON.stringify(content, null, 2)
    .replace(/[\u0080-￿]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
  fs.writeFileSync(CONTENT_FILE, `window.SITE_CONTENT = ${json};\n`);
}

// Every list whose cards can show a picture, as [section label, array of items]
function imageLists(content) {
  return [
    ['lego.wishlist', content.lego.wishlist],
    ['lego.owned', content.lego.owned],
    ['zelda.wishlist', content.zelda.wishlist],
    ['zelda.owned', content.zelda.owned],
    ['boardgames.wishlist', content.boardgames.wishlist],
    ['boardgames.owned', content.boardgames.owned],
    ['books.normal', content.books.normal],
    ['health.owned', content.health.owned],
    ['health.wishlist', content.health.wishlist],
    ['grooming.items', content.grooming.items],
    ['consumables.items', content.consumables.items],
    ...content.junk.categories.map(category => [`junk.${category.id}`, category.items])
  ];
}

function words(text) {
  return new Set(text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(word => word && !STOPWORDS.has(word)));
}

// Share of the item's own words that the search result title contains
function matchScore(name, title) {
  const wanted = words(name);
  const found = words(title);
  if (wanted.size === 0) {
    return 0;
  }
  return [...wanted].filter(word => found.has(word)).length / wanted.size;
}

function decode(text) {
  return text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
}

function parseResults(html) {
  const results = [];
  const starts = [...html.matchAll(/data-component-type="s-search-result"/g)].map(match => match.index);
  for (const [index, start] of starts.entries()) {
    const block = html.slice(start, starts[index + 1] || start + 12000);
    const img = block.match(/<img[^>]*class="s-image"[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/);
    if (!img) {
      continue;
    }
    const title = decode(img[2]);
    if (title.startsWith('Sponsored')) {
      continue;
    }
    results.push({ title, img: img[1].replace(/\._AC_[A-Z]+\d+_\./, '._AC_SL500_.') });
  }
  return results;
}

async function search(query) {
  const res = await fetch(SEARCH_URL + encodeURIComponent(query), { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`Amazon search "${query}": HTTP ${res.status}`);
  }
  return parseResults(await res.text());
}

function searchQuery(name) {
  return name.replace(/\([^)]*\)/g, ' ').replace(/[–—:&+]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function findCandidates(content) {
  const previous = fs.existsSync(CANDIDATES_FILE) ? JSON.parse(fs.readFileSync(CANDIDATES_FILE, 'utf8')) : [];
  // Entries for items that already have their picture stay in the file as a record of where it came from
  const missing = new Set(imageLists(content).flatMap(([section, items]) => items.filter(entry => !entry.img).map(entry => `${section}|${entry.name}`)));
  const candidates = previous.filter(entry => !missing.has(`${entry.section}|${entry.name}`));
  for (const [section, items] of imageLists(content)) {
    for (const item of items.filter(entry => !entry.img)) {
      const known = previous.find(entry => entry.section === section && entry.name === item.name);
      const query = known ? known.query : searchQuery(item.name);
      if (known && known.searched === query) {
        candidates.push(known);
        continue;
      }
      const options = (await search(query))
        .map(result => ({ ...result, score: Number(matchScore(query, result.title).toFixed(2)) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, OPTIONS_KEPT);
      candidates.push({ section, name: item.name, query, searched: query, pick: null, options });
      console.log(`[Images] ${item.name}`);
      options.forEach((option, index) => console.log(`           ${index}: ${option.score} ${option.title.slice(0, 90)}`));
      await new Promise(resolve => setTimeout(resolve, PAUSE_MS));
    }
  }
  fs.writeFileSync(CANDIDATES_FILE, JSON.stringify(candidates, null, 2) + '\n');
  console.log(`[Images] Wrote ${candidates.length} candidates to ${CANDIDATES_FILE}`);
}

// Runs in the product page. Shopify exposes the product as JSON next to the page; elsewhere
// fall back to structured data, then the social-share picture.
const PAGE_IMAGE_SCRIPT = `(async () => {
  try {
    const res = await fetch(location.pathname.replace(/\\/$/, '') + '.js');
    if (res.ok) {
      const product = await res.json();
      if (product.featured_image) { return { img: product.featured_image.replace(/^\\/\\//, 'https://'), title: product.title }; }
    }
  } catch (err) {}
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const nodes = [].concat(JSON.parse(script.textContent));
      const product = nodes.flatMap(node => node['@graph'] || node).find(node => node['@type'] === 'Product');
      const image = product && [].concat(product.image)[0];
      if (image) { return { img: typeof image === 'string' ? image : image.url, title: product.name }; }
    } catch (err) {}
  }
  const og = document.querySelector('meta[property="og:image"]');
  return { img: og ? og.content : '', title: document.title };
})()`;

async function findPageImages(content) {
  const puppeteer = require('puppeteer');
  const candidates = fs.existsSync(CANDIDATES_FILE) ? JSON.parse(fs.readFileSync(CANDIDATES_FILE, 'utf8')) : [];
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent(HEADERS['User-Agent']);
  for (const [section, items] of imageLists(content)) {
    for (const item of items.filter(entry => !entry.img && /^https?:/.test(entry.url || ''))) {
      if (candidates.some(entry => entry.section === section && entry.name === item.name && entry.searched === item.url)) {
        continue;
      }
      let option = { title: '', img: '', status: 0 };
      try {
        const res = await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        option = { ...(await page.evaluate(PAGE_IMAGE_SCRIPT)), status: res.status() };
      } catch (err) {
        option.title = err.message.split('\n')[0];
      }
      const kept = candidates.filter(entry => !(entry.section === section && entry.name === item.name));
      candidates.length = 0;
      candidates.push(...kept, { section, name: item.name, query: item.url, searched: item.url, pick: null, options: [option] });
      console.log(`[Images] ${option.status} ${item.name.slice(0, 44).padEnd(46)} → ${String(option.title).slice(0, 50).padEnd(52)} ${option.img ? 'picture' : 'no picture'}`);
      await new Promise(resolve => setTimeout(resolve, PAUSE_MS));
    }
  }
  await browser.close();
  fs.writeFileSync(CANDIDATES_FILE, JSON.stringify(candidates, null, 2) + '\n');
  console.log(`[Images] Wrote ${candidates.length} candidates to ${CANDIDATES_FILE}`);
}

function applyCandidates(content) {
  const candidates = JSON.parse(fs.readFileSync(CANDIDATES_FILE, 'utf8'));
  const lists = new Map(imageLists(content));
  let applied = 0;
  for (const candidate of candidates.filter(entry => entry.pick !== null)) {
    const item = (lists.get(candidate.section) || []).find(entry => entry.name === candidate.name);
    if (!item) {
      continue;
    }
    if (item.img) {
      continue;
    }
    item.img = candidate.options[candidate.pick].img;
    applied++;
  }
  saveContent(content);
  console.log(`[Images] Applied ${applied} images`);
}

async function main() {
  const content = loadContent();
  if (process.argv.includes('--apply')) {
    applyCandidates(content);
    return;
  }
  if (process.argv.includes('--pages')) {
    await findPageImages(content);
    return;
  }
  await findCandidates(content);
}

main().catch(err => {
  console.error(`[Images] ${err.message}`);
  process.exit(1);
});
