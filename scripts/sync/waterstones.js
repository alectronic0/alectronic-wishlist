#!/usr/bin/env node

/**
 * Waterstones Wish List Sync
 *
 * The wish list ("My Wish List", id 55345240) is private, so it is read and written from inside the
 * signed-in automation Chrome. The public /booklist/<id>/<hash> share link 404s even when signed in.
 *   read:  POST /account/listbooks/id/<list>/start/<n>/count/10  (JSON)
 *   write: GET  /account/listaddbook?listid=<list>&bookid=<id>   (bookid = data-bookid on the book page)
 *          GET  /account/listremovebook/listid/<list>/bookid/<id>
 *
 * Usage:
 *   node scripts/sync/waterstones.js                    # snapshot → data/sources/waterstones.json
 *   node scripts/sync/waterstones.js --apply [--limit N] # apply the Waterstones actions from data/books_plan.json
 */

const fs = require('fs');
const path = require('path');
const { evalInNewTab } = require('./cdp');

const LIST_ID = '55345240';
const ORIGIN = 'https://www.waterstones.com';
const LIST_URL = `${ORIGIN}/account/list/id/${LIST_ID}`;
const ROOT = path.join(__dirname, '..', '..');
const OUTPUT_FILE = path.join(ROOT, 'data', 'sources', 'waterstones.json');
const PLAN_FILE = path.join(ROOT, 'data', 'books_plan.json');
const BATCH = 10;
const PAUSE_MS = 1500;
const BATCH_PAUSE_MS = 8000;

const READ_SCRIPT = `(async () => {
  const books = [];
  for (let start = 0; start < 2000; start += 10) {
    const res = await fetch('/account/listbooks/id/${LIST_ID}/start/' + start + '/count/10', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
    if (!res.ok) { return JSON.stringify({ error: res.status }); }
    const page = (await res.json()).books || [];
    books.push(...page);
    if (page.length < 10) { break; }
  }
  return JSON.stringify({ books });
})()`;

const ADD_SCRIPT = isbns => `(async () => {
  const results = [];
  for (const isbn of ${JSON.stringify(isbns)}) {
    const page = await fetch('/book/x/x/' + isbn);
    // Unknown ISBNs land on a search page full of other books' ids, so only trust the book's own page
    const ownPage = page.url.endsWith('/' + isbn);
    const bookId = ownPage ? ((await page.text()).match(/data-bookid="(\\d+)"/) || [])[1] : '';
    if (!bookId) {
      results.push({ isbn, status: 'not-sold' });
      continue;
    }
    const res = await fetch('/account/listaddbook?listid=${LIST_ID}&bookid=' + bookId, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
    const body = res.ok ? await res.json() : {};
    if (!body.success) {
      results.push({ isbn, status: 'failed', http: res.status });
      return JSON.stringify(results);
    }
    results.push({ isbn, status: 'added' });
    await new Promise(resolve => setTimeout(resolve, ${PAUSE_MS}));
  }
  return JSON.stringify(results);
})()`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Waterstones titles repeat the volume and series: "Komi Can't Communicate, Vol. 7 Volume 7 - Komi Can't Communicate (Paperback)"
function cleanTitle(title) {
  return title.replace(/\s*\((?:Paperback|Hardback|Board book|Mixed media product)\)\s*$/i, '').split(' - ')[0].replace(/\s+Volume \d+$/, '').trim();
}

async function snapshot() {
  const raw = await evalInNewTab(LIST_URL, READ_SCRIPT);
  if (raw.error) {
    throw new Error(`list answered HTTP ${raw.error} — signed out? snapshot not written`);
  }
  const books = raw.books.map(book => ({
    id: String(book.id),
    title: cleanTitle(book.title),
    author: book.contributor ? book.contributor.name : '',
    isbn13: (book.url.match(/(97[89]\d{10})$/) || [])[1] || '',
    format: book.format || '',
    img: book.imageUrlLarge || '',
    url: ORIGIN + book.url
  }));
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ scrapedAt: new Date().toISOString(), url: LIST_URL, books }, null, 2) + '\n');
  console.log(`[WaterstonesSync] ${books.length} books → ${OUTPUT_FILE}`);
}

const REMOVE_SCRIPT = bookIds => `(async () => {
  for (const bookId of ${JSON.stringify(bookIds)}) {
    const res = await fetch('/account/listremovebook/listid/${LIST_ID}/bookid/' + bookId);
    if (!res.ok) { return JSON.stringify({ failed: bookId, http: res.status }); }
    await new Promise(resolve => setTimeout(resolve, ${PAUSE_MS}));
  }
  return JSON.stringify({ failed: null });
})()`;

async function remove(plan) {
  const bookIds = plan.filter(entry => entry.op.startsWith('remove')).map(entry => entry.bookId);
  if (bookIds.length === 0) {
    return;
  }
  const result = await evalInNewTab(LIST_URL, REMOVE_SCRIPT(bookIds));
  if (result.failed) {
    throw new Error(`listremovebook failed (HTTP ${result.http}) on ${result.failed}, stopping`);
  }
  console.log(`[WaterstonesSync] removed ${bookIds.length} owned books`);
}

async function apply(limit) {
  const plan = JSON.parse(fs.readFileSync(PLAN_FILE, 'utf8')).plan.waterstones;
  await remove(plan);
  const actions = plan.filter(entry => entry.op === 'add');
  const noIsbn = actions.filter(entry => !entry.isbn13);
  const isbns = actions.filter(entry => entry.isbn13).map(entry => entry.isbn13).slice(0, limit);
  console.log(`[WaterstonesSync] adding ${isbns.length} (${noIsbn.length} skipped, no ISBN)`);
  const notSold = [];
  let added = 0;
  for (let i = 0; i < isbns.length; i += BATCH) {
    const results = await evalInNewTab(LIST_URL, ADD_SCRIPT(isbns.slice(i, i + BATCH)));
    added += results.filter(result => result.status === 'added').length;
    notSold.push(...results.filter(result => result.status === 'not-sold').map(result => result.isbn));
    const failed = results.find(result => result.status === 'failed');
    if (failed) {
      throw new Error(`listaddbook failed (HTTP ${failed.http}) on ${failed.isbn} after ${added} adds, stopping`);
    }
    console.log(`[WaterstonesSync] ${Math.min(i + BATCH, isbns.length)}/${isbns.length} (added ${added})`);
    await sleep(BATCH_PAUSE_MS);
  }
  const titleOf = isbn => (actions.find(entry => entry.isbn13 === isbn) || {}).title;
  notSold.forEach(isbn => console.log(`  not sold by Waterstones: ${isbn} ${titleOf(isbn)}`));
  noIsbn.forEach(entry => console.log(`  no ISBN: ${entry.title}`));
}

async function main() {
  if (process.argv.includes('--apply')) {
    const limitIndex = process.argv.indexOf('--limit');
    await apply(limitIndex > -1 ? Number(process.argv[limitIndex + 1]) : Infinity);
  }
  await snapshot();
}

main().catch(err => {
  console.error(`[WaterstonesSync] ${err.message.split('\n')[0]}`);
  process.exit(1);
});
