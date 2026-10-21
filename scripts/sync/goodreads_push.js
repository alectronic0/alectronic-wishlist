#!/usr/bin/env node

/**
 * Goodreads Push
 *
 * Applies the Goodreads part of data/books_plan.json (built by scripts/books_merge.js).
 * Runs inside the signed-in automation Chrome; requests go out in small paced batches and the run
 * stops at the first failure so a throttled account is never hammered.
 *
 * Usage:
 *   node scripts/sync/goodreads_push.js --lookup          # resolve Goodreads ids only (read-only)
 *   node scripts/sync/goodreads_push.js --apply [--limit N]
 */

const fs = require('fs');
const path = require('path');
const { evalInNewTab } = require('./cdp');
const { titleWords, titleOverlap, coverage, TITLE_MATCH } = require('../lib/titles');
const { volumeOf } = require('../books_merge');

const ROOT = path.join(__dirname, '..', '..');
const PLAN_FILE = path.join(ROOT, 'data', 'books_plan.json');
const LOOKUP_FILE = path.join(ROOT, 'data', 'goodreads_lookup.json');
const SHELF_PAGE = 'https://www.goodreads.com/review/list/194943775';
const BATCH = 10;
const PAUSE_MS = 1200;
const BATCH_PAUSE_MS = 8000;
const AUTHOR_MATCH = 0.5;

const lookupKey = action => `${action.title}|${action.author}`;

// Runs in the page: ISBN redirects straight to the book; otherwise the autocomplete JSON gives candidates
const LOOKUP_SCRIPT = queries => `(async () => {
  const out = {};
  for (const query of ${JSON.stringify(queries)}) {
    const result = { isbnId: '', candidates: [] };
    if (query.isbn13) {
      const res = await fetch('https://www.goodreads.com/book/isbn/' + query.isbn13, { credentials: 'include' });
      // Goodreads' bot challenge: HTTP 202 with an empty page, after ~160 page loads
      if (res.status === 202) { out.__error = 202; break; }
      const match = res.url.match(/\\/book\\/show\\/(\\d+)/);
      result.isbnId = match ? match[1] : '';
    }
    if (!result.isbnId) {
      const res = await fetch('https://www.goodreads.com/book/auto_complete?format=json&q=' + encodeURIComponent(query.q), { credentials: 'include' });
      if (!res.ok || res.status === 202) { out.__error = res.status; break; }
      result.candidates = (await res.json()).slice(0, 5).map(hit => ({ id: hit.bookId, title: hit.bookTitleBare, author: hit.author.name }));
    }
    out[query.key] = result;
    await new Promise(resolve => setTimeout(resolve, ${PAUSE_MS}));
  }
  return JSON.stringify(out);
})()`;

const APPLY_SCRIPT = writes => `(async () => {
  const token = document.querySelector('meta[name=csrf-token]').content;
  const done = [];
  for (const write of ${JSON.stringify(writes)}) {
    const body = new URLSearchParams({ utf8: '✓', authenticity_token: token, book_id: write.id, name: write.shelf, a: write.remove ? 'remove' : '' });
    const res = await fetch('https://www.goodreads.com/shelf/add_to_shelf', { method: 'POST', body, credentials: 'include', headers: { 'X-CSRF-Token': token, 'X-Requested-With': 'XMLHttpRequest' } });
    if (!res.ok) { return JSON.stringify({ done, failed: { ...write, status: res.status } }); }
    done.push(write);
    await new Promise(resolve => setTimeout(resolve, ${PAUSE_MS}));
  }
  return JSON.stringify({ done, failed: null });
})()`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadLookup() {
  return fs.existsSync(LOOKUP_FILE) ? JSON.parse(fs.readFileSync(LOOKUP_FILE, 'utf8')) : {};
}

// Search hits must agree on the volume and on the whole title in both directions:
// "Fullmetal Alchemist, Vol. 1" is not Vol. 2, and a 7-book collection is not one volume
function bestCandidate(action, candidates) {
  const words = titleWords(action.title);
  const authors = titleWords(action.author || '');
  return candidates.find(candidate => {
    const hitWords = titleWords(candidate.title);
    const similar = coverage(words, hitWords) >= TITLE_MATCH && coverage(hitWords, words) >= TITLE_MATCH;
    if (!similar) {
      return false;
    }
    if (volumeOf(action.title) !== volumeOf(candidate.title)) {
      return false;
    }
    if (authors.size === 0) {
      return true;
    }
    return titleOverlap(authors, titleWords(candidate.author)) >= AUTHOR_MATCH;
  }) || null;
}

async function lookup(actions) {
  const known = loadLookup();
  const pending = new Map();
  for (const action of actions.filter(entry => entry.lookup)) {
    const key = lookupKey(action);
    if (!known[key]) {
      pending.set(key, { key, isbn13: action.isbn13, q: `${action.title.split(/[:(]/)[0]} ${action.author}`.trim(), action });
    }
  }
  const queries = [...pending.values()];
  for (let i = 0; i < queries.length; i += BATCH) {
    const batch = queries.slice(i, i + BATCH);
    const raw = await evalInNewTab(SHELF_PAGE, LOOKUP_SCRIPT(batch.map(({ key, isbn13, q }) => ({ key, isbn13, q }))));
    for (const query of batch.filter(entry => raw[entry.key])) {
      const result = raw[query.key];
      const hit = result.isbnId ? { id: result.isbnId, via: 'isbn' } : bestCandidate(query.action, result.candidates);
      known[query.key] = hit ? { id: hit.id, via: hit.via || 'search', title: hit.title || '' } : { id: '', candidates: result.candidates };
    }
    fs.writeFileSync(LOOKUP_FILE, JSON.stringify(known, null, 2) + '\n');
    if (raw.__error) {
      throw new Error(`Goodreads answered HTTP ${raw.__error} — stopped; lookups so far are saved, re-run later`);
    }
    console.log(`[GoodreadsPush] looked up ${Math.min(i + BATCH, queries.length)}/${queries.length}`);
    await sleep(BATCH_PAUSE_MS);
  }
  const unresolved = Object.entries(known).filter(([, value]) => !value.id);
  console.log(`[GoodreadsPush] ${Object.keys(known).length} looked up, ${unresolved.length} unresolved`);
  unresolved.forEach(([key]) => console.log(`  unresolved: ${key}`));
}

function writesFor(actions) {
  const known = loadLookup();
  const writes = [];
  for (const action of actions) {
    const id = action.goodreadsId || (known[lookupKey(action)] || {}).id;
    if (!id) {
      continue;
    }
    const remove = action.op.startsWith('remove from ');
    const shelf = action.op.replace(/^(shelve on|remove from) /, '');
    writes.push({ id, shelf, remove, title: action.title });
  }
  return writes;
}

async function apply(actions, limit) {
  const writes = writesFor(actions).slice(0, limit);
  console.log(`[GoodreadsPush] applying ${writes.length} shelf changes`);
  let applied = 0;
  for (let i = 0; i < writes.length; i += BATCH) {
    const result = await evalInNewTab(SHELF_PAGE, APPLY_SCRIPT(writes.slice(i, i + BATCH)));
    applied += result.done.length;
    if (result.failed) {
      throw new Error(`HTTP ${result.failed.status} on "${result.failed.title}" → ${result.failed.shelf} after ${applied} writes, stopping`);
    }
    console.log(`[GoodreadsPush] ${applied}/${writes.length}`);
    await sleep(BATCH_PAUSE_MS);
  }
}

async function main() {
  const actions = JSON.parse(fs.readFileSync(PLAN_FILE, 'utf8')).plan.goodreads;
  const limitIndex = process.argv.indexOf('--limit');
  const limit = limitIndex > -1 ? Number(process.argv[limitIndex + 1]) : Infinity;
  if (process.argv.includes('--lookup')) {
    await lookup(actions);
    return;
  }
  if (process.argv.includes('--apply')) {
    await apply(actions, limit);
    return;
  }
  console.log('Pass --lookup or --apply');
}

main().catch(err => {
  console.error(`[GoodreadsPush] ${err.message.split('\n')[0]}`);
  process.exit(1);
});
