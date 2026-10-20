#!/usr/bin/env node

/**
 * Book merge
 *
 * Folds every book source into one master record per book and works out what each service is
 * missing so they can all be brought into line. Nothing is written to any service here.
 *
 * Sources: Goodreads shelves, Amazon "Book Collection" wishlist, Play Books library + wishlist,
 * Waterstones booklist, data/books_manual.json and the hand-entered books already on the site.
 *
 * Usage:
 *   node scripts/books_merge.js           # writes data/books_master.json + data/books_plan.json
 *   node scripts/books_merge.js --quiet   # same, summary only
 */

const fs = require('fs');
const path = require('path');
const { TITLE_MATCH, titleWords, titleOverlap, coverage, goodreadsTitle, goodreadsAuthor } = require('./lib/titles');

const ROOT = path.join(__dirname, '..');
const SOURCES = path.join(ROOT, 'data', 'sources');
const CONTENT_FILE = path.join(ROOT, 'js', 'content.js');
const MANUAL_FILE = path.join(ROOT, 'data', 'books_manual.json');
const MASTER_FILE = path.join(ROOT, 'data', 'books_master.json');
const PLAN_FILE = path.join(ROOT, 'data', 'books_plan.json');
const META_FILE = path.join(ROOT, 'data', 'goodreads_meta.json');
const SERIES_FILE = path.join(ROOT, 'data', 'goodreads_series.json');
const SERIES_CHOICE_FILE = path.join(ROOT, 'data', 'books_series.json');
const SERIES_CANDIDATES_FILE = path.join(ROOT, 'data', 'books_series_candidates.json');
const AUTHOR_MATCH = 0.5;

// Each format is decided by evidence: an explicit Goodreads format shelf beats everything,
// a Play library entry proves digital, and an owned shelf/site entry implies physical.
const EVIDENCE = { explicit: 'explicit', proven: 'proven', implied: 'implied' };

function loadJson(file, fallback = null) {
  if (!fs.existsSync(file)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadSiteBooks() {
  global.window = {};
  require(CONTENT_FILE);
  return global.window.SITE_CONTENT.books;
}

function isbn10To13(isbn10) {
  const core = '978' + isbn10.slice(0, 9);
  const sum = [...core].reduce((total, digit, i) => total + Number(digit) * (i % 2 ? 3 : 1), 0);
  return core + ((10 - (sum % 10)) % 10);
}

function normaliseIsbn(value) {
  const digits = String(value || '').replace(/[^0-9X]/gi, '').toUpperCase();
  if (/^97[89]\d{10}$/.test(digits)) {
    return digits;
  }
  if (/^\d{9}[\dX]$/.test(digits)) {
    return isbn10To13(digits);
  }
  return '';
}

// Amazon ASINs for print books are their ISBN-10
function isbnFromAsin(asin) {
  return /^\d{9}[\dX]$/i.test(asin || '') ? isbn10To13(asin) : '';
}

function volumeOf(title) {
  const match = title.match(/(?:\bvol(?:ume)?\.?|\bbook|#)\s*(\d+(?:\.\d+)?)/i) || title.match(/[,:]\s*(\d+)\s*$/);
  return match ? Number(match[1]) : null;
}

// A missing volume number matches every volume, so "…, Vol. 7" without a "(Series, #7)" suffix
// still has to yield 7 or a whole series folds into one record
function goodreadsSeries(rawTitle) {
  const match = rawTitle.match(/\(([^()]+?),?\s*#([\d.]+)\)\s*$/);
  return match ? { series: match[1].trim(), seriesNo: Number(match[2]) } : { series: '', seriesNo: volumeOf(rawTitle) };
}

function splitSiteName(name) {
  const match = name.match(/^(.*) \(([^()]+)\)$/);
  return match ? { title: match[1], author: match[2] } : { title: name, author: '' };
}

function asinFromUrl(url) {
  const match = (url || '').match(/\/dp\/([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : '';
}

function fromGoodreads(goodreads) {
  const shelfStatus = { 'my-bookcase': 'owned', 'my-wishlist': 'wanted', 'owned-physical': 'owned', 'owned-digital': 'owned' };
  const out = [];
  for (const [shelf, status] of Object.entries(shelfStatus)) {
    for (const book of goodreads.shelves[shelf] || []) {
      const formats = {};
      if (shelf === 'owned-physical') {
        formats.physical = EVIDENCE.explicit;
      }
      if (shelf === 'owned-digital') {
        formats.digital = EVIDENCE.explicit;
      }
      if (shelf === 'my-bookcase') {
        formats.physical = EVIDENCE.implied;
      }
      out.push({
        source: 'goodreads', shelf, status, formats,
        ref: book.id,
        title: goodreadsTitle(book),
        author: goodreadsAuthor(book),
        ...goodreadsSeries(book.title),
        isbn13: normaliseIsbn(book.isbn13 || book.isbn),
        asin: book.asin && !/^\d/.test(book.asin) ? book.asin : '',
        img: book.img,
        url: book.url
      });
    }
  }
  return out;
}

function fromAmazon(list) {
  return list.items.map(item => {
    const byline = (item.byline || '').match(/^by (.*?)\s*\(([^)]*)\)?$/);
    return {
      source: 'amazon', status: 'wanted', formats: {},
      ref: item.asin,
      title: item.title,
      author: byline ? byline[1].split(',')[0].trim() : '',
      edition: byline ? byline[2].trim() : '',
      series: '', seriesNo: volumeOf(item.title),
      isbn13: isbnFromAsin(item.asin),
      asin: item.asin,
      img: item.img,
      url: item.url
    };
  });
}

function fromPlay(play) {
  const entry = (book, source, status) => ({
    source, status,
    formats: status === 'owned' ? { digital: EVIDENCE.proven } : {},
    ref: book.id,
    title: book.title,
    author: book.author || '',
    series: book.series || '',
    seriesNo: book.seriesNo !== null && book.seriesNo !== undefined ? book.seriesNo : volumeOf(book.title),
    isbn13: normaliseIsbn(book.isbn13),
    asin: '',
    audiobook: book.format === 'audiobook',
    img: book.img,
    url: book.url
  });
  return [
    ...play.library.map(book => entry(book, 'playLibrary', 'owned')),
    ...play.wishlist.map(book => entry(book, 'playWishlist', 'wanted'))
  ];
}

function fromWaterstones(waterstones) {
  return waterstones.books.map(book => ({
    source: 'waterstones', status: 'wanted', formats: {},
    ref: book.id,
    title: book.title,
    author: book.author || '',
    series: '', seriesNo: volumeOf(book.title),
    isbn13: normaliseIsbn(book.isbn13),
    asin: '',
    img: book.img,
    url: book.url
  }));
}

function fromManual(manual) {
  return manual.books.map(book => ({
    source: 'manual', status: book.status || 'wanted',
    formats: Object.fromEntries((book.formats || []).map(format => [format, EVIDENCE.explicit])),
    ref: book.isbn13 || book.title,
    title: book.title,
    author: book.author || '',
    series: book.series || '',
    seriesNo: book.seriesNo || volumeOf(book.title),
    isbn13: normaliseIsbn(book.isbn13),
    asin: book.asin || '',
    img: book.img || '',
    url: book.url || ''
  }));
}

// Site entries that only mirror a synced list are skipped; hand-entered ones (photo inventory) are real evidence
function fromSite(books) {
  const out = [];
  for (const book of books.normal) {
    const fromList = book.goodreadsId || (book.status === 'wanted' && /amazon\./.test(book.url || ''));
    if (fromList) {
      continue;
    }
    const { title, author } = splitSiteName(book.name);
    const asin = book.asin || asinFromUrl(book.amazon || book.url);
    out.push({
      source: 'site', status: book.status,
      formats: book.status === 'owned' ? { physical: EVIDENCE.implied } : {},
      ref: book.name,
      title, author, series: '', seriesNo: volumeOf(title),
      isbn13: isbnFromAsin(asin), asin,
      img: book.img || '', url: book.goodreads || book.url || ''
    });
  }
  for (const series of books.manga) {
    const digital = /kindle/i.test(series.series);
    const name = series.series.replace(/\s*\(Kindle\)\s*$/i, '');
    for (const volume of series.volumes) {
      if (volume.status !== 'owned') {
        continue;
      }
      const asin = asinFromUrl(volume.amazon);
      out.push({
        source: 'site', status: 'owned',
        formats: digital ? { digital: EVIDENCE.proven } : { physical: EVIDENCE.implied },
        ref: `${series.series} #${volume.vol}`,
        title: `${name}, Vol. ${volume.vol}`,
        author: series.author || '',
        series: name, seriesNo: volume.vol,
        isbn13: isbnFromAsin(asin), asin,
        img: volume.img || '', url: volume.goodreads || volume.amazon || ''
      });
    }
  }
  return out;
}

// Marketing tails and edition notes after a colon or bracket rarely survive across services
function coreWords(title) {
  return titleWords(title.split(/[:(\[]| - | \| /)[0]);
}

function authorWords(author) {
  return titleWords(author.replace(/\band\b|&/g, ' '));
}

function sameVolume(left, right) {
  if (left === null || right === null) {
    return true;
  }
  return left === right;
}

function matches(record, candidate) {
  const sameIsbn = candidate.isbn13 && record.isbn13s.has(candidate.isbn13);
  if (sameIsbn) {
    return true;
  }
  const sameAsin = candidate.asin && record.asins.has(candidate.asin);
  if (sameAsin) {
    return true;
  }
  if (!sameVolume(record.seriesNo, candidate.seriesNo)) {
    return false;
  }
  const authors = authorWords(candidate.author);
  const authorKnown = authors.size > 0 && record.authorWords.size > 0;
  if (authorKnown && titleOverlap(authors, record.authorWords) < AUTHOR_MATCH) {
    return false;
  }
  const words = titleWords(candidate.title);
  // One-word titles ("Heroes", "Troy") only match with a known author and an exact core title
  const core = coreWords(candidate.title);
  const short = core.size < 2 || record.coreWords.size < 2;
  if (short) {
    const sameCore = [...core].join(' ') === [...record.coreWords].join(' ');
    const sameFull = [...words].join(' ') === [...record.fullWords].join(' ');
    return sameFull || (authorKnown && sameCore);
  }
  // Full titles, not the part before the colon: "Fullmetal Alchemist: Fullmetal Edition" and
  // "Fullmetal Alchemist: The Complete Four-Panel Comics" share only the series name.
  // A shorter title sitting wholly inside a longer one still matches, which covers marketing tails.
  const contained = titleOverlap(words, record.fullWords) === 1;
  // Otherwise both titles must mostly agree, so "Complete Box Set" never folds into "Legendary Edition Box Set"
  const similar = coverage(words, record.fullWords) >= TITLE_MATCH && coverage(record.fullWords, words) >= TITLE_MATCH;
  if (!contained && !similar) {
    return false;
  }
  // Two different ISBNs are usually two products ("Complete Box Set" vs "Legendary Edition Box Set"),
  // so the longer title must not carry extra words either
  const conflictingIsbn = candidate.isbn13 && record.isbn13s.size > 0;
  if (conflictingIsbn) {
    return similar;
  }
  return true;
}

const TITLE_PREFERENCE = ['goodreads', 'site', 'manual', 'playLibrary', 'waterstones', 'playWishlist', 'amazon'];
const SERIES_PREFERENCE = ['goodreads', 'playLibrary', 'playWishlist', 'manual', 'site'];

function newRecord(candidate) {
  return {
    candidates: [],
    isbn13s: new Set(),
    asins: new Set(),
    seriesNo: candidate.seriesNo,
    authorWords: authorWords(candidate.author),
    coreWords: coreWords(candidate.title),
    fullWords: titleWords(candidate.title)
  };
}

function absorb(record, candidate) {
  record.candidates.push(candidate);
  if (candidate.isbn13) {
    record.isbn13s.add(candidate.isbn13);
  }
  if (candidate.asin) {
    record.asins.add(candidate.asin);
  }
  if (record.seriesNo === null) {
    record.seriesNo = candidate.seriesNo;
  }
  if (record.authorWords.size === 0) {
    record.authorWords = authorWords(candidate.author);
  }
}

function pick(candidates, order, field) {
  for (const source of order) {
    const hit = candidates.find(candidate => candidate.source === source && candidate[field]);
    if (hit) {
      return hit[field];
    }
  }
  return '';
}

function resolveFormats(owned) {
  const evidence = { physical: [], digital: [] };
  for (const candidate of owned) {
    for (const [format, strength] of Object.entries(candidate.formats)) {
      evidence[format].push(strength);
    }
  }
  const explicit = evidence.physical.includes(EVIDENCE.explicit) || evidence.digital.includes(EVIDENCE.explicit);
  if (explicit) {
    return { formats: ['physical', 'digital'].filter(format => evidence[format].includes(EVIDENCE.explicit)), unconfirmed: [] };
  }
  const formats = [];
  const unconfirmed = [];
  if (evidence.digital.length > 0) {
    formats.push('digital');
  }
  // "On my bookcase" next to a Play purchase may just mean the ebook, so ask instead of assuming a print copy
  if (evidence.physical.length > 0 && evidence.digital.length > 0) {
    unconfirmed.push('physical');
  }
  if (evidence.physical.length > 0 && evidence.digital.length === 0) {
    formats.push('physical');
  }
  return { formats, unconfirmed };
}

// Amazon and Waterstones lists hold print wants, the Play wishlist digital ones; Goodreads and the
// site do not say, and an unspecified want defaults to print
const WANT_FORMAT = { amazon: 'physical', waterstones: 'physical', playWishlist: 'digital' };

function wantedFormats(wanted, owned) {
  const wants = new Set();
  let unspecified = false;
  for (const candidate of wanted) {
    const declared = candidate.source === 'manual' ? Object.keys(candidate.formats) : [WANT_FORMAT[candidate.source]].filter(Boolean);
    declared.forEach(format => wants.add(format));
    unspecified = unspecified || declared.length === 0;
  }
  // Owning any copy settles a want that never named a format
  if (unspecified && wants.size === 0 && owned.length === 0) {
    wants.add('physical');
  }
  return wants;
}

function seriesFromTitle(title) {
  return title.replace(/,?\s*(?:\bvol(?:ume)?\.?|\bbook|#)\s*\d+.*$/i, '').replace(/[,:]\s*\d+\s*$/, '').replace(/[\s,:-]+$/, '').trim();
}

function finalise(record) {
  const { candidates } = record;
  const owned = candidates.filter(candidate => candidate.status === 'owned');
  const wanted = candidates.filter(candidate => candidate.status === 'wanted');
  const { formats, unconfirmed } = owned.length > 0 ? resolveFormats(owned) : { formats: [], unconfirmed: [] };
  const wants = [...wantedFormats(wanted, owned)].filter(format => !formats.includes(format));
  const seriesNo = pick(candidates, SERIES_PREFERENCE, 'seriesNo') || record.seriesNo || null;
  const sources = {};
  for (const candidate of candidates) {
    const key = candidate.source === 'goodreads' ? `goodreads:${candidate.shelf}` : candidate.source;
    const known = sources[key];
    if (known) {
      known.refs.push(candidate.ref);
      continue;
    }
    sources[key] = { ref: candidate.ref, refs: [candidate.ref], url: candidate.url };
  }
  const title = pick(candidates, TITLE_PREFERENCE, 'title');
  return {
    // Play store titles drop the volume number and keep it only in the series line
    title: seriesNo && volumeOf(title) === null ? `${title}, Vol. ${seriesNo}` : title,
    author: pick(candidates, ['goodreads', 'playLibrary', 'playWishlist', 'site', 'manual', 'amazon', 'waterstones'], 'author'),
    series: seriesFromTitle(pick(candidates, SERIES_PREFERENCE, 'series') || (seriesNo ? title : '')),
    seriesNo,
    status: owned.length > 0 ? 'owned' : 'wanted',
    formats,
    unconfirmed,
    wants,
    audiobook: candidates.some(candidate => candidate.audiobook),
    isbn13: [...record.isbn13s][0] || '',
    isbn13s: [...record.isbn13s],
    asins: [...record.asins],
    img: pick(candidates, ['goodreads', 'playLibrary', 'playWishlist', 'site', 'amazon', 'waterstones', 'manual'], 'img'),
    sources
  };
}

// Services spell one series several ways ("SPY×FAMILY 1", "Spy x Family"); per author the most
// common spelling wins so every volume lands under one heading
function seriesKey(series) {
  return [...titleWords(series.replace(/×/g, ' x '))].filter(word => !/^\d+$/.test(word)).join(' ');
}

function unifySeries(books) {
  const spellings = new Map();
  for (const book of books.filter(entry => entry.series)) {
    const key = `${book.author}|${seriesKey(book.series)}`;
    const counts = spellings.get(key) || new Map();
    counts.set(book.series, (counts.get(book.series) || 0) + 1);
    spellings.set(key, counts);
  }
  for (const book of books.filter(entry => entry.series)) {
    const counts = spellings.get(`${book.author}|${seriesKey(book.series)}`);
    book.series = [...counts.entries()].sort((left, right) => right[1] - left[1])[0][0];
  }
  return books;
}

function merge(candidates) {
  const records = [];
  for (const candidate of candidates) {
    const record = records.find(entry => matches(entry, candidate)) || null;
    if (record) {
      absorb(record, candidate);
      continue;
    }
    const created = newRecord(candidate);
    absorb(created, candidate);
    records.push(created);
  }
  return unifySeries(records.map(finalise));
}

function onAny(book, prefix) {
  return Object.keys(book.sources).some(key => key.startsWith(prefix));
}

function action(book, op, extra = {}) {
  return { op, title: book.title, author: book.author, isbn13: book.isbn13, ...extra };
}

function planGoodreads(books, hasFormatShelves) {
  const actions = [];
  for (const book of books) {
    const ref = Object.entries(book.sources).find(([key]) => key.startsWith('goodreads:') || key === 'series');
    const targets = [];
    if (book.status === 'owned') {
      targets.push('my-bookcase', ...book.formats.map(format => `owned-${format}`));
    }
    // my-bookcase and my-wishlist are exclusive shelves (a book sits on one), so an owned book stays on
    // the bookcase; a print want for an owned ebook lives on the Amazon and Waterstones lists instead
    if (book.wants.length > 0 && book.status !== 'owned') {
      targets.push('my-wishlist');
    }
    for (const shelf of targets) {
      if (book.sources[`goodreads:${shelf}`]) {
        continue;
      }
      const needsShelf = shelf.startsWith('owned-') && !hasFormatShelves;
      actions.push(action(book, `shelve on ${shelf}`, ref ? { goodreadsId: ref[1].ref, needsShelf } : { lookup: true, needsShelf }));
    }
    const settled = targets.includes('my-bookcase') && book.sources['goodreads:my-wishlist'];
    if (settled) {
      actions.push(action(book, 'remove from my-wishlist', { goodreadsId: ref[1].ref }));
    }
  }
  return actions;
}

function planWishlist(books, source, { format, idField, available }) {
  if (!available) {
    return [{ op: 'skipped', reason: `${source} snapshot missing — sign in and run its sync first` }];
  }
  const actions = [];
  for (const book of books) {
    const listed = Boolean(book.sources[source]);
    const wanted = book.wants.includes(format);
    if (listed && !wanted) {
      book.sources[source].refs.forEach(ref => actions.push(action(book, `remove (owned ${format})`, { [idField]: ref })));
    }
    if (!listed && wanted) {
      actions.push(action(book, 'add', { lookup: true }));
    }
  }
  return actions;
}

function summarise(plan, books) {
  const owned = books.filter(book => book.status === 'owned');
  const count = format => owned.filter(book => book.formats.includes(format)).length;
  const wanting = format => books.filter(book => book.wants.includes(format)).length;
  console.log(`[BooksMerge] ${books.length} books: ${owned.length} owned (physical ${count('physical')}, digital ${count('digital')}); wanted physical ${wanting('physical')}, digital ${wanting('digital')}`);
  console.log(`[BooksMerge] ${books.filter(book => book.unconfirmed.length).length} owned books need a physical/digital answer`);
  console.log('');
  console.log('| Service | Action | Count |');
  console.log('|---|---|---|');
  for (const [service, actions] of Object.entries(plan)) {
    const byOp = {};
    for (const entry of actions) {
      byOp[entry.op] = (byOp[entry.op] || 0) + 1;
    }
    for (const [op, total] of Object.entries(byOp)) {
      console.log(`| ${service} | ${op} | ${total} |`);
    }
  }
}

function goodreadsRefs(book) {
  return Object.entries(book.sources)
    .filter(([source]) => source.startsWith('goodreads:') || source === 'series')
    .flatMap(([, entry]) => entry.refs.map(String));
}

function seriesIdOf(book, meta) {
  const hit = goodreadsRefs(book).map(id => meta[id]).find(entry => entry && entry.seriesId);
  return hit ? hit.seriesId : '';
}

// Every Goodreads series Alec has a book from, for him to pick which ones to complete
function seriesCandidates(books, meta, series) {
  const bySeries = new Map();
  for (const book of books) {
    const id = seriesIdOf(book, meta);
    if (!id || !series[id]) {
      continue;
    }
    const entry = bySeries.get(id) || { id, name: book.series || book.title, author: book.author, have: [], volumes: series[id].volumes.length };
    entry.have.push(book.seriesNo);
    bySeries.set(id, entry);
  }
  return [...bySeries.values()].sort((left, right) => right.have.length - left.have.length);
}

// Missing volumes of the chosen series become print wants, keyed to the existing books' author and series name
function fromSeries(books, meta, series, chosen) {
  const out = [];
  for (const id of chosen) {
    const members = books.filter(book => seriesIdOf(book, meta) === id);
    if (members.length === 0 || !series[id]) {
      continue;
    }
    const have = new Set(members.map(book => book.seriesNo).filter(no => no !== null));
    const { author, series: name } = members[0];
    for (const volume of series[id].volumes.filter(entry => !have.has(entry.no))) {
      const details = meta[volume.id] || {};
      out.push({
        source: 'series', status: 'wanted', formats: {},
        ref: volume.id,
        title: name ? `${name}, Vol. ${volume.no}` : volume.title,
        author,
        series: name, seriesNo: volume.no,
        isbn13: normaliseIsbn(details.isbn13),
        asin: '',
        img: details.img || volume.img,
        url: `https://www.goodreads.com/book/show/${volume.id}`
      });
    }
  }
  return out;
}

function sortBooks(books) {
  return books.sort((left, right) =>
    left.author.localeCompare(right.author) || left.series.localeCompare(right.series) ||
    (left.seriesNo || 0) - (right.seriesNo || 0) || left.title.localeCompare(right.title));
}

function main() {
  const goodreads = loadJson(path.join(SOURCES, 'goodreads.json'));
  const amazon = loadJson(path.join(SOURCES, 'amazon.json'));
  const play = loadJson(path.join(SOURCES, 'playbooks.json'));
  const waterstones = loadJson(path.join(SOURCES, 'waterstones.json'));
  const manual = loadJson(MANUAL_FILE, { books: [] });

  // Order matters: the richest sources seed the records, thinner ones attach to them
  const candidates = [
    ...fromGoodreads(goodreads),
    ...fromSite(loadSiteBooks()),
    ...(play ? fromPlay(play) : []),
    ...fromAmazon(amazon.lists.books),
    ...(waterstones ? fromWaterstones(waterstones) : []),
    ...fromManual(manual)
  ];
  const meta = loadJson(META_FILE, {});
  const series = loadJson(SERIES_FILE, {});
  const chosen = loadJson(SERIES_CHOICE_FILE, { complete: [] }).complete;
  const firstPass = merge(candidates);
  fs.writeFileSync(SERIES_CANDIDATES_FILE, JSON.stringify(seriesCandidates(firstPass, meta, series), null, 2) + '\n');
  const completion = fromSeries(firstPass, meta, series, chosen);
  const books = sortBooks(completion.length > 0 ? merge([...candidates, ...completion]) : firstPass);

  const hasFormatShelves = Boolean(goodreads.shelves['owned-physical'] || goodreads.shelves['owned-digital']);
  const plan = {
    goodreads: planGoodreads(books, hasFormatShelves),
    amazon: planWishlist(books, 'amazon', { format: 'physical', idField: 'asin', available: true }),
    waterstones: planWishlist(books, 'waterstones', { format: 'physical', idField: 'bookId', available: Boolean(waterstones) }),
    // Play tags purchased books on the wishlist as "Purchased" and the web offers no way to remove them
    playWishlist: planWishlist(books.filter(book => !book.sources.playLibrary), 'playWishlist', { format: 'digital', idField: 'playId', available: Boolean(play) })
  };

  fs.writeFileSync(MASTER_FILE, JSON.stringify({ builtAt: new Date().toISOString(), books }, null, 2) + '\n');
  fs.writeFileSync(PLAN_FILE, JSON.stringify({ builtAt: new Date().toISOString(), plan }, null, 2) + '\n');
  summarise(plan, books);
  if (completion.length > 0) {
    console.log(`[BooksMerge] ${completion.length} missing volumes added from ${chosen.length} chosen series`);
  }
  console.log('');
  console.log(`[BooksMerge] Wrote ${MASTER_FILE} and ${PLAN_FILE}`);
}

if (require.main === module) {
  main();
}

module.exports = { merge, normaliseIsbn, volumeOf };
