#!/usr/bin/env node

/**
 * Goodreads Shelf Sync
 *
 * Goodreads is the source of truth for books: my-bookcase = owned, my-wishlist = wanted.
 * Shelves are fetched from inside a signed-in automation Chrome tab over CDP.
 *
 * Usage:
 *   node scripts/sync/goodreads.js
 */

const fs = require('fs');
const path = require('path');
const { evalInNewTab } = require('./cdp');

const USER_ID = '194943775';
const ORIGIN = 'https://www.goodreads.com';
const PROFILE_URL = `${ORIGIN}/user/show/${USER_ID}`;
const OUTPUT_FILE = path.join(__dirname, '..', '..', 'data', 'sources', 'goodreads.json');
const SHELVES = ['my-bookcase', 'my-wishlist', 'to-read', 'read', 'currently-reading', 'did-not-finish'];
const PER_PAGE = 100;

const PAGE_SCRIPT = `(async () => {
  const text = (row, field) => {
    const cell = row.querySelector('td.field.' + field + ' .value');
    return cell ? cell.textContent.replace(/\\s+/g, ' ').trim() : '';
  };
  const out = {};
  for (const shelf of ${JSON.stringify(SHELVES)}) {
    const books = [];
    for (let page = 1; page < 20; page++) {
      const res = await fetch('/review/list/${USER_ID}?shelf=' + shelf + '&per_page=${PER_PAGE}&page=' + page, { credentials: 'include' });
      if (!res.ok) { out[shelf] = { error: res.status }; break; }
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const rows = [...doc.querySelectorAll('tr.bookalike')];
      for (const row of rows) {
        const link = row.querySelector('td.field.title a');
        const img = row.querySelector('td.field.cover img');
        books.push({
          title: link.textContent.replace(/\\s+/g, ' ').trim(),
          href: link.getAttribute('href'),
          author: text(row, 'author').replace(/\\s*\\*$/, ''),
          isbn: text(row, 'isbn'),
          isbn13: text(row, 'isbn13'),
          asin: text(row, 'asin'),
          img: img ? img.getAttribute('src') : ''
        });
      }
      if (rows.length < ${PER_PAGE}) { break; }
    }
    if (!out[shelf]) { out[shelf] = { books }; }
  }
  return JSON.stringify(out);
})()`;

// Shelf thumbnails are 50px wide; dropping the size suffix gives the full cover
function fullCover(src) {
  return src.replace(/\._S[XY]\d+(_S[XY]\d+)?_?\./, '.');
}

async function main() {
  const raw = await evalInNewTab(PROFILE_URL, PAGE_SCRIPT);
  const shelves = {};
  for (const shelf of SHELVES) {
    if (raw[shelf].error) {
      throw new Error(`${shelf}: HTTP ${raw[shelf].error}, snapshot not written`);
    }
    shelves[shelf] = raw[shelf].books.map(book => ({
      id: (book.href.match(/\/book\/show\/(\d+)/) || [])[1] || '',
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      isbn13: book.isbn13,
      asin: book.asin,
      img: /nophoto/.test(book.img) ? '' : fullCover(book.img),
      url: ORIGIN + book.href
    }));
    console.log(`[GoodreadsSync] ${shelf}: ${shelves[shelf].length} books`);
  }
  if (shelves['my-bookcase'].length + shelves['my-wishlist'].length === 0) {
    throw new Error('both main shelves are empty — signed out or markup changed, snapshot not written');
  }
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ scrapedAt: new Date().toISOString(), url: PROFILE_URL, shelves }, null, 2) + '\n');
  console.log(`[GoodreadsSync] Wrote ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error(`[GoodreadsSync] ${err.message.split('\n')[0]}`);
  process.exit(1);
});
