#!/usr/bin/env node

/**
 * ISBNs for series fill-ins (read-only)
 *
 * Volumes added to fill a series (data/books_series.json `fill`) often have no Goodreads page cached,
 * and Goodreads throttles after ~160 page loads, so their ISBNs come from the Waterstones search
 * instead. A search that names one book redirects to that book's page; otherwise the result list is
 * checked. A hit must carry the series' words and exactly the wanted volume number, and be the right
 * format (manga vs light novel), or it is left unresolved rather than guessed.
 *   data/books_isbn.json  { "Series, Vol. N": { isbn13, title } | { isbn13: '' } }
 *
 * Usage:
 *   node scripts/sync/books_isbn.js
 */

const fs = require('fs');
const path = require('path');
const { withTab, sleep } = require('./cdp');
const { titleWords, coverage } = require('../lib/titles');

const ROOT = path.join(__dirname, '..', '..');
const MASTER_FILE = path.join(ROOT, 'data', 'books_master.json');
const SERIES_CHOICE_FILE = path.join(ROOT, 'data', 'books_series.json');
const ISBN_FILE = path.join(ROOT, 'data', 'books_isbn.json');
const ORIGIN = 'https://www.waterstones.com';
const PER_EVAL = 4;
const PAUSE_MS = 2000;
const SERIES_MATCH = 0.75;
// Words a shop adds around a volume title; anything else (": Vigilantes", "The Film Vault") is another book
const FILLER = new Set(['vol', 'volume', 'manga', 'light', 'novel', 'paperback', 'hardback']);

// Runs in the page: each query returns either the book page it redirected to or the search hits
const SEARCH_SCRIPT = queries => `(async () => {
  const out = {};
  for (const query of ${JSON.stringify(queries)}) {
    const res = await fetch('${ORIGIN}/books/search/term/' + encodeURIComponent(query));
    const html = await res.text();
    const page = res.url.match(/\\/book\\/[^/]+\\/[^/]+\\/(97[89]\\d{10})$/);
    if (page) {
      out[query] = [[page[1], (html.match(/<title>([^<|]*)/) || [])[1] || '']];
    } else {
      out[query] = [...html.matchAll(/href="\\/book\\/[^"]+\\/(97[89]\\d{10})"[^>]*>([^<]{3,160})</g)].map(match => [match[1], match[2].trim()]);
    }
    await new Promise(resolve => setTimeout(resolve, ${PAUSE_MS}));
  }
  return JSON.stringify(out);
})()`;

function load(file, fallback) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
}

function acceptable(hit, { series, no, lightNovel }) {
  const [, title] = hit;
  const numbers = new Set((title.match(/\d+/g) || []).map(Number));
  if (numbers.size !== 1 || !numbers.has(no)) {
    return false;
  }
  if (/box set|collection|\bset\b/i.test(title)) {
    return false;
  }
  if (/light novel/i.test(title) !== lightNovel) {
    return false;
  }
  const seriesWords = titleWords(series);
  const hitWords = new Set([...titleWords(title.split(' by ')[0])].filter(word => !FILLER.has(word) && !/^\d+$/.test(word)));
  // Every remaining word of the hit must belong to the series: "My Hero Academia: Vigilantes" is a spin-off
  return coverage(seriesWords, hitWords) >= SERIES_MATCH && coverage(hitWords, seriesWords) === 1;
}

async function main() {
  const { books } = load(MASTER_FILE, { books: [] });
  const notes = load(SERIES_CHOICE_FILE, {}).notes || {};
  const known = load(ISBN_FILE, {});
  const wanted = books.filter(book => book.sources.fill && !book.isbn13 && !(book.title in known));
  console.log(`[BooksIsbn] ${wanted.length} fill-ins to look up`);

  const lookups = wanted.map(book => ({
    key: book.title,
    series: book.series,
    no: book.seriesNo,
    lightNovel: Boolean((notes[book.series] || {}).lightNovel),
    queries: [`${book.series} ${book.seriesNo}`, `${book.series} Volume ${book.seriesNo}`, `${book.series}, Vol. ${book.seriesNo}`]
  }));
  await withTab(`${ORIGIN}/`, async evalHere => {
    for (let i = 0; i < lookups.length; i += PER_EVAL) {
      const batch = lookups.slice(i, i + PER_EVAL);
      const results = evalHere(SEARCH_SCRIPT(batch.flatMap(lookup => lookup.queries)));
      for (const lookup of batch) {
        const hit = lookup.queries.flatMap(query => results[query] || []).find(entry => acceptable(entry, lookup));
        known[lookup.key] = hit ? { isbn13: hit[0], title: hit[1] } : { isbn13: '' };
      }
      fs.writeFileSync(ISBN_FILE, JSON.stringify(known, null, 2) + '\n');
      console.log(`[BooksIsbn] ${Math.min(i + PER_EVAL, lookups.length)}/${lookups.length}`);
      await sleep(PAUSE_MS);
    }
  });
  const missing = Object.entries(known).filter(([, value]) => !value.isbn13).map(([key]) => key);
  console.log(`[BooksIsbn] ${Object.keys(known).length - missing.length} resolved, ${missing.length} not found`);
  missing.forEach(key => console.log(`  not found: ${key}`));
}

if (require.main === module) main().catch(err => {
  console.error(`[BooksIsbn] ${err.message.split('\n')[0]}`);
  process.exit(1);
});

module.exports = { acceptable };
