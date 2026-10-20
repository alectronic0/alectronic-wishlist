#!/usr/bin/env node

/**
 * Goodreads book + series metadata (read-only)
 *
 * For every book in data/books_master.json that has a Goodreads id, reads the book page for its
 * genres, series id and ISBN-13; then reads each series page for the full volume list so missing
 * volumes can be wanted. Results are cached, so re-runs only fetch what is new.
 *   data/goodreads_meta.json    { bookId: { genres[], seriesId, isbn13, title, img } }
 *   data/goodreads_series.json  { seriesId: { volumes: [{ no, id, title, img }] } }
 *
 * Usage:
 *   node scripts/sync/goodreads_meta.js [--refresh-series]
 */

const fs = require('fs');
const path = require('path');
const { withTab, sleep } = require('./cdp');

const ROOT = path.join(__dirname, '..', '..');
const MASTER_FILE = path.join(ROOT, 'data', 'books_master.json');
const META_FILE = path.join(ROOT, 'data', 'goodreads_meta.json');
const SERIES_FILE = path.join(ROOT, 'data', 'goodreads_series.json');
const SERIES_CHOICE_FILE = path.join(ROOT, 'data', 'books_series.json');
const ORIGIN = 'https://www.goodreads.com';
const TAB_URL = `${ORIGIN}/review/list/194943775`;
// Each evaluation must finish inside the bridge's ~60s limit
const PER_EVAL = 4;
const PAUSE_MS = 1200;
const EVAL_PAUSE_MS = 4000;

const BOOK_SCRIPT = ids => `(async () => {
  const out = {};
  for (const id of ${JSON.stringify(ids)}) {
    const res = await fetch('${ORIGIN}/book/show/' + id, { credentials: 'include' });
    if (!res.ok) { out[id] = { error: res.status }; continue; }
    const html = await res.text();
    const series = html.match(/href="https:\\/\\/www\\.goodreads\\.com\\/series\\/(\\d+)/);
    const title = html.match(/<meta property="og:title" content="([^"]*)"/);
    const image = html.match(/<meta property="og:image" content="([^"]*)"/);
    out[id] = {
      genres: [...new Set([...html.matchAll(/\\/genres\\/([a-z0-9-]+)/g)].map(match => match[1]))].slice(0, 8),
      seriesId: series ? series[1] : '',
      isbn13: (html.match(/"isbn13":"(\\d{13})"/) || [])[1] || '',
      title: title ? title[1] : '',
      img: image ? image[1] : ''
    };
    await new Promise(resolve => setTimeout(resolve, ${PAUSE_MS}));
  }
  return JSON.stringify(out);
})()`;

// Series pages list each entry as "Book N" + cover link; ranges ("Book 1-3") and halves are box sets and side stories
const SERIES_SCRIPT = ids => `(async () => {
  const out = {};
  for (const id of ${JSON.stringify(ids)}) {
    const volumes = [];
    for (let page = 1; page < 6; page++) {
      const res = await fetch('${ORIGIN}/series/' + id + '?page=' + page, { credentials: 'include' });
      if (!res.ok) { break; }
      const items = (await res.text()).split('listWithDividers__item').slice(1);
      for (const item of items) {
        const label = item.match(/<h3[^>]*>Book ([^<]+)<\\/h3>/);
        const book = item.match(/href="\\/book\\/show\\/(\\d+)[^"]*"/);
        const cover = item.match(/<img src="([^"]+)" alt="([^"]*)"/);
        if (!label || !book || !/^\\d+$/.test(label[1].trim())) { continue; }
        volumes.push({ no: Number(label[1]), id: book[1], title: cover ? cover[2] : '', img: cover ? cover[1] : '' });
      }
      if (items.length < 30) { break; }
      await new Promise(resolve => setTimeout(resolve, ${PAUSE_MS}));
    }
    out[id] = { volumes };
    await new Promise(resolve => setTimeout(resolve, ${PAUSE_MS}));
  }
  return JSON.stringify(out);
})()`;

function load(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
}

function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function goodreadsIds(books) {
  const ids = new Set();
  for (const book of books) {
    for (const [source, entry] of Object.entries(book.sources)) {
      if (source.startsWith('goodreads:') || source === 'series') {
        entry.refs.forEach(ref => ids.add(String(ref)));
      }
    }
  }
  return [...ids];
}

async function fetchInChunks(ids, script, cache, file, label) {
  if (ids.length === 0) {
    return;
  }
  await withTab(TAB_URL, async evalHere => {
    for (let i = 0; i < ids.length; i += PER_EVAL) {
      Object.assign(cache, evalHere(script(ids.slice(i, i + PER_EVAL))));
      save(file, cache);
      console.log(`[GoodreadsMeta] ${label} ${Math.min(i + PER_EVAL, ids.length)}/${ids.length}`);
      await sleep(EVAL_PAUSE_MS);
    }
  });
}

async function main() {
  const { books } = JSON.parse(fs.readFileSync(MASTER_FILE, 'utf8'));
  const meta = load(META_FILE);
  const series = load(SERIES_FILE);

  const missingBooks = goodreadsIds(books).filter(id => !meta[id] || meta[id].error);
  await fetchInChunks(missingBooks, BOOK_SCRIPT, meta, META_FILE, 'books');

  const seriesIds = [...new Set(Object.values(meta).map(entry => entry.seriesId).filter(Boolean))];
  const refresh = process.argv.includes('--refresh-series');
  const missingSeries = seriesIds.filter(id => refresh || !series[id]);
  await fetchInChunks(missingSeries, SERIES_SCRIPT, series, SERIES_FILE, 'series');

  // Only series chosen for completion (data/books_series.json) get their missing volumes' ISBNs:
  // publisher series such as "Do Books" would otherwise pull in dozens of unrelated titles
  const chosen = load(SERIES_CHOICE_FILE).complete || [];
  const volumeIds = chosen.flatMap(id => (series[id] ? series[id].volumes.map(volume => volume.id) : []));
  const missingVolumes = volumeIds.filter(id => !meta[id]);
  await fetchInChunks(missingVolumes, BOOK_SCRIPT, meta, META_FILE, 'volumes');

  console.log(`[GoodreadsMeta] ${Object.keys(meta).length} books, ${Object.keys(series).length} series cached`);
}

main().catch(err => {
  console.error(`[GoodreadsMeta] ${err.message.split('\n')[0]}`);
  process.exit(1);
});
