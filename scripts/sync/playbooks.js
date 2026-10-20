#!/usr/bin/env node

/**
 * Google Play Books Sync
 *
 * Library (owned, digital) and Play wishlist (wanted) are read from the signed-in automation Chrome.
 * Each book is then enriched from its public store page (JSON-LD ISBN/author, series name + number).
 * Uploaded files (PDFs) have no store page and no author link, so they are skipped.
 *
 * Usage:
 *   node scripts/sync/playbooks.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { evalInNewTab } = require('./cdp');

const LIBRARY_URL = 'https://play.google.com/books';
const WISHLIST_URL = 'https://play.google.com/wishlist';
const DETAILS_URL = id => `https://play.google.com/store/books/details?id=${id}&hl=en_GB&gl=GB`;
const OUTPUT_FILE = path.join(__dirname, '..', '..', 'data', 'sources', 'playbooks.json');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const DETAILS_DELAY_MS = 400;

// The library is a lazily rendered grid inside a scroll container, not the window
const SCROLL_ALL = `for (let i = 0; i < 20; i++) {
    document.querySelectorAll('*').forEach(el => { if (el.scrollHeight > el.clientHeight + 50) { el.scrollTop = el.scrollHeight; } });
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(resolve => setTimeout(resolve, 700));
  }`;

const LIBRARY_SCRIPT = `(async () => {
  ${SCROLL_ALL}
  const books = [...document.querySelectorAll('gpb-volume-card .card')].map(card => {
    // Audiobooks link to a player instead of the reader, but every card carries a hidden title-<id> label
    const label = card.querySelector('[id^="title-"]');
    const author = card.querySelector('a[href*="/store/books/author"]');
    return {
      id: label.id.slice('title-'.length),
      title: label.textContent.replace(/^for /, '').trim(),
      author: author ? author.textContent.trim() : '',
      kind: card.classList.contains('audiobook') ? 'audiobook' : 'ebook',
      uploaded: !author
    };
  });
  return JSON.stringify(books);
})()`;

const WISHLIST_SCRIPT = `(async () => {
  ${SCROLL_ALL}
  const ids = [...document.querySelectorAll('a[href*="/store/books/details"]')]
    .map(link => new URL(link.href).searchParams.get('id'))
    .filter(Boolean);
  return JSON.stringify([...new Set(ids)]);
})()`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en-GB' } }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

function decodeHtml(text) {
  return text.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function parseDetails(html) {
  const ld = [...html.matchAll(/application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map(match => JSON.parse(match[1]))
    .find(entry => entry['@type'] === 'Book');
  if (!ld) {
    return null;
  }
  // Series line renders as <span itemprop="name">Series</span> <span itemprop="name">Book 3</span>
  const series = html.match(/<span itemprop="name">([^<]+)<\/span> <span itemprop="name">(?:Book|Vol\.?|Volume|Part) ([\d.]+)<\/span>/);
  const image = html.match(/<meta property="og:image" content="([^"]+)"/);
  return {
    title: decodeHtml(ld.name),
    author: (ld.author || []).map(person => person.name).join(', '),
    isbn13: (ld.workExample && ld.workExample.isbn) || '',
    format: ld.workExample && /Audio/.test(ld.workExample.bookFormat) ? 'audiobook' : 'ebook',
    series: series ? decodeHtml(series[1]) : '',
    seriesNo: series ? Number(series[2]) : null,
    img: image ? decodeHtml(image[1]) : ''
  };
}

async function enrich(id, fallback) {
  const res = await get(DETAILS_URL(id));
  await sleep(DETAILS_DELAY_MS);
  const details = res.status === 200 ? parseDetails(res.body) : null;
  if (!details) {
    console.warn(`[PlayBooksSync] no store page for ${id} (HTTP ${res.status}) — ${fallback.title || '?'}`);
  }
  const book = { id, ...fallback, ...(details || {}), url: `https://play.google.com/store/books/details?id=${id}` };
  // Store titles carry marketing tails ("…: The second book in the GLOBALLY BESTSELLING…"); the library card has the plain one
  if (fallback.title) {
    book.title = fallback.title;
  }
  return book;
}

async function main() {
  const library = await evalInNewTab(LIBRARY_URL, LIBRARY_SCRIPT);
  const wishlistIds = await evalInNewTab(WISHLIST_URL, WISHLIST_SCRIPT);
  if (library.length + wishlistIds.length === 0) {
    throw new Error('library and wishlist are both empty — signed out or markup changed, snapshot not written');
  }

  const purchased = library.filter(book => !book.uploaded);
  const uploads = library.filter(book => book.uploaded).map(book => book.title);
  console.log(`[PlayBooksSync] library: ${purchased.length} store books, ${uploads.length} uploads skipped`);

  const owned = [];
  for (const book of purchased) {
    owned.push(await enrich(book.id, { title: book.title, author: book.author, format: book.kind }));
  }
  const wanted = [];
  for (const id of wishlistIds) {
    wanted.push(await enrich(id, {}));
  }
  console.log(`[PlayBooksSync] wishlist: ${wanted.length} books`);

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ scrapedAt: new Date().toISOString(), library: owned, wishlist: wanted, uploads }, null, 2) + '\n');
  console.log(`[PlayBooksSync] Wrote ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error(`[PlayBooksSync] ${err.message.split('\n')[0]}`);
  process.exit(1);
});
