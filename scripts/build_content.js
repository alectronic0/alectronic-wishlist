#!/usr/bin/env node

/**
 * Content Builder
 *
 * Merges the source snapshots in data/sources/ into js/content.js.
 * It only adds and updates: anything on the site that a source no longer lists is
 * reported, never deleted, so a blocked scrape cannot wipe the wishlist.
 *
 * Usage:
 *   node scripts/build_content.js            # write js/content.js
 *   node scripts/build_content.js --dry-run  # report only
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_FILE = path.join(ROOT, 'js', 'content.js');
const AMAZON_FILE = path.join(ROOT, 'data', 'sources', 'amazon.json');
const GOODREADS_FILE = path.join(ROOT, 'data', 'sources', 'goodreads.json');
const NINTENDO_FILE = path.join(ROOT, 'data', 'sources', 'nintendo.json');
const LEGO_FILE = path.join(ROOT, 'data', 'sources', 'lego.json');
const BGG_FILE = path.join(ROOT, 'data', 'sources', 'bgg.json');
const IGDB_FILE = path.join(ROOT, 'data', 'sources', 'igdb.json');
const SHOP_FILE = path.join(ROOT, 'data', 'shop_items.json');
const OVERRIDES_FILE = path.join(ROOT, 'data', 'overrides.json');
const CONTENT_PREFIX = 'window.SITE_CONTENT = ';
const AMAZON_DP = 'https://www.amazon.co.uk/dp/';
const TITLE_MAX = 70;
const IGDB_OWNED_LISTS = {
  'steam': { platform: 'pc', badge: 'Steam' },
  'nintendo-switch-1-and-2': { platform: 'switch', badge: 'Nintendo Switch' },
  'nintendo-wii-u': { platform: 'wii_wiiu', badge: 'Nintendo Wii U' },
  'nintendo-wii': { platform: 'wii_wiiu', badge: 'Nintendo Wii' },
  'nintendo-gamecube': { platform: 'gamecube', badge: 'Nintendo GameCube' },
  'nintendo-64': { platform: 'n64', badge: 'Nintendo 64' },
  'nintendo-3ds': { platform: '3ds', badge: 'Nintendo 3DS' },
  'nintendo-ds': { platform: 'ds', badge: 'Nintendo DS' },
  'game-boy-advance': { platform: 'gba', badge: 'Game Boy Advance' },
  'game-boy-and-game-boy-colour': { platform: 'gb_gbc', badge: 'Game Boy & Game Boy Colour' },
  'nintendo-snes': { platform: 'snes', badge: 'Nintendo SNES' },
  'nintendo-nes': { platform: 'nes', badge: 'Nintendo NES' }
};
const IGDB_WISHLIST = { list: 'steam-wishlist', platform: 'pc', badge: 'Steam Wishlist' };

const report = [];

function loadContent() {
  global.window = {};
  require(CONTENT_FILE);
  return global.window.SITE_CONTENT;
}

function saveContent(content) {
  // content.js is kept ASCII-only so re-serialising leaves untouched lines byte-identical
  const json = JSON.stringify(content, null, 2)
    .replace(/[\u0080-￿]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
  fs.writeFileSync(CONTENT_FILE, `${CONTENT_PREFIX}${json};\n`);
}

function asinOf(url) {
  const match = (url || '').match(/\/dp\/([A-Z0-9]{10})/i);
  return match ? match[1] : null;
}

function formatPrice(price) {
  if (price === null) {
    return '';
  }
  return `£${price.toFixed(2)}`;
}

function isAmazonImage(url) {
  return (url || '').includes('m.media-amazon.com');
}

function syncBoardgameLink(target, item) {
  target.asin = item.asin;
  target.amazonUrl = item.url;
}

function syncBoardgames(content, list, overrides) {
  const wishlist = content.boardgames.wishlist;
  content.boardgames.amazonWishlistUrl = list.url;

  for (const item of list.items) {
    const mapping = overrides.amazon[item.asin];
    if (!mapping) {
      wishlist.push({ name: item.title, asin: item.asin, img: item.img, amazonUrl: item.url });
      report.push(`boardgames: NEW unmapped item added with raw Amazon title — ${item.asin} ${item.title}`);
      continue;
    }
    const game = wishlist.find(entry => entry.name === mapping.game);
    if (!game) {
      report.push(`boardgames: override points at missing game "${mapping.game}" (${item.asin})`);
      continue;
    }
    if (!mapping.expansion) {
      syncBoardgameLink(game, item);
      if (item.img && (!game.img || isAmazonImage(game.img))) {
        game.img = item.img;
      }
      continue;
    }
    const expansion = (game.expansions || []).find(entry => entry.name === mapping.expansion);
    if (!expansion) {
      report.push(`boardgames: override points at missing expansion "${mapping.expansion}" (${item.asin})`);
      continue;
    }
    syncBoardgameLink(expansion, item);
  }

  const listed = new Set(list.items.map(item => item.asin));
  for (const game of wishlist) {
    const asin = game.asin || asinOf(game.amazonUrl);
    if (!listed.has(asin)) {
      report.push(`boardgames: site-only wishlist game (not on Amazon list) — ${game.name}`);
    }
  }
}

function movePurchasedBoardgames(content, purchased) {
  const { wishlist, owned } = content.boardgames;
  for (const [name, extra] of Object.entries(purchased)) {
    const index = wishlist.findIndex(entry => entry.name === name);
    if (index === -1) {
      continue;
    }
    const [game] = wishlist.splice(index, 1);
    owned.push({ ...game, ...extra });
    report.push(`boardgames: moved to owned — ${name}`);
  }
}

function matchSeries(item, overrides) {
  const legendaryVol = overrides.legendaryEditions.volumes[item.asin];
  if (legendaryVol) {
    return { def: overrides.legendaryEditions, vol: legendaryVol };
  }
  for (const def of overrides.series) {
    const match = item.title.match(new RegExp(def.match, 'i'));
    if (match) {
      return { def, vol: Number(match[1]) };
    }
  }
  return null;
}

function upsertVolume(content, def, vol, item) {
  let series = content.books.manga.find(entry => entry.series === def.series);
  if (!series) {
    series = { series: def.series, author: def.author, notes: def.notes || '', img: '', wishlistUrl: '', volumes: [] };
    content.books.manga.push(series);
  }
  let volume = series.volumes.find(entry => entry.vol === vol);
  if (!volume) {
    volume = { vol, status: 'wanted' };
    series.volumes.push(volume);
  }
  if (volume.status === 'owned') {
    report.push(`books: still on Amazon wishlist but marked owned — ${def.series} vol ${vol}`);
    return series;
  }
  volume.img = item.img;
  volume.amazon = item.url;
  volume.price = formatPrice(item.price);
  return series;
}

function parseByline(byline) {
  const match = byline.match(/^by (.*?)\s*\(([^)]*)\)?$/);
  if (!match) {
    return { author: '', format: '' };
  }
  return { author: match[1].split(',')[0].trim(), format: match[2].trim() };
}

function shortTitle(title) {
  let short = title.split(' | ')[0].replace(/\s*\([^)]*\)?\s*$/, '');
  while (short.length > TITLE_MAX && short.includes(':')) {
    short = short.slice(0, short.lastIndexOf(':')).trim();
  }
  return short;
}

function bookName(item, author) {
  const title = shortTitle(item.title);
  if (!author) {
    return title;
  }
  return `${title} (${author})`;
}

function bookCategory(item, overrides, fallback) {
  for (const rule of overrides.categories) {
    if (new RegExp(rule.match, 'i').test(item.title)) {
      return rule.category;
    }
  }
  return fallback;
}

function upsertBook(content, item, overrides) {
  const { author, format } = parseByline(item.byline);
  const fields = {
    name: bookName(item, author),
    // Everything on the Amazon book list that is not manga or a game guide is a cookbook
    category: bookCategory(item, overrides, overrides.amazonCategory),
    status: 'wanted',
    badge: format,
    img: item.img,
    url: item.url,
    price: formatPrice(item.price),
    asin: item.asin
  };
  // Still on the Amazon wishlist, but Alec already has it
  if (overrides.owned[item.asin]) {
    fields.status = 'owned';
    fields.price = '';
  }
  const existing = content.books.normal.find(entry => (entry.asin || asinOf(entry.url)) === item.asin);
  if (existing) {
    Object.assign(existing, fields);
    return;
  }
  content.books.normal.push(fields);
}

function syncBooks(content, list, overrides) {
  content.books.amazonWishlistUrl = list.url;
  // Earlier entries linked to the wishlist page instead of a product; the snapshot replaces them
  content.books.normal = content.books.normal.filter(entry => !(entry.url || '').includes('/hz/wishlist/'));

  const touched = new Set();
  for (const item of list.items) {
    const hit = matchSeries(item, overrides);
    if (!hit) {
      upsertBook(content, item, overrides);
      continue;
    }
    touched.add(upsertVolume(content, hit.def, hit.vol, item));
  }

  const listed = new Set(list.items.map(item => item.asin));
  for (const series of content.books.manga) {
    series.volumes.sort((a, b) => a.vol - b.vol);
    if (touched.has(series)) {
      const cover = series.volumes.find(volume => volume.img);
      series.img = cover ? cover.img : '';
      series.wishlistUrl = list.url;
    }
    const siteOnly = series.volumes
      .filter(volume => volume.status === 'wanted' && !listed.has(asinOf(volume.amazon)))
      .map(volume => volume.vol);
    if (siteOnly.length > 0) {
      report.push(`books: wanted on site but not on Amazon list — ${series.series} vols ${siteOnly.join(', ')}`);
    }
  }
  for (const book of content.books.normal) {
    if (book.status !== 'wanted') {
      continue;
    }
    if (!listed.has(book.asin || asinOf(book.url))) {
      report.push(`books: wanted on site but not on Amazon list — ${book.name}`);
    }
  }
  for (const title of Object.values(overrides.owned)) {
    report.push(`books: owned but still on the Amazon wishlist — ${title}`);
  }
}

function gameKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function gameCard(game, target) {
  return { name: game.name, badge: target.badge, img: game.img, platform: target.platform, url: game.url };
}

function syncOwnedGames(content, lists, overrides) {
  // Explicit corrections: cards listed here are known duplicates of another card on the same platform
  content.videogames.owned = content.videogames.owned.filter(entry =>
    !overrides.duplicates.some(duplicate => duplicate.platform === entry.platform && duplicate.name === entry.name));
  const owned = content.videogames.owned;
  for (const [slug, target] of Object.entries(IGDB_OWNED_LISTS)) {
    const games = lists[slug].games;
    for (const game of games) {
      const onPlatform = owned.filter(entry => entry.platform === target.platform);
      // The IGDB list holds a different edition from the cartridge actually owned
      const same = overrides.sameGame.find(entry => entry.platform === target.platform && entry.listed === game.url);
      if (same && onPlatform.some(entry => entry.url === same.actual)) {
        continue;
      }
      const existing = onPlatform.find(entry => entry.url === game.url)
        || onPlatform.find(entry => gameKey(entry.name) === gameKey(game.name));
      if (!existing) {
        owned.push(gameCard(game, target));
        continue;
      }
      // Hand-entered cards often point at a regional or DLC variant; IGDB's list entry wins
      existing.url = game.url;
      existing.img = game.img || existing.img;
    }
  }

  for (const platform of new Set(Object.values(IGDB_OWNED_LISTS).map(target => target.platform))) {
    const listed = Object.entries(IGDB_OWNED_LISTS)
      .filter(([, target]) => target.platform === platform)
      .flatMap(([slug]) => lists[slug].games.map(game => game.url))
      .concat(overrides.sameGame.filter(entry => entry.platform === platform).map(entry => entry.actual));
    const siteOnly = owned.filter(entry => entry.platform === platform && !listed.includes(entry.url));
    if (siteOnly.length === 0) {
      continue;
    }
    if (listed.length === 0) {
      report.push(`videogames: ${platform} has ${siteOnly.length} games on site but its IGDB list is empty`);
      continue;
    }
    report.push(`videogames: on site but not on IGDB (${platform}) — ${siteOnly.map(entry => entry.name).join('; ')}`);
  }
}

function syncGames(content, igdb, overrides) {
  syncOwnedGames(content, igdb.lists, overrides);
  const wishlist = igdb.lists[IGDB_WISHLIST.list];
  content.videogames.wishlistUrl = wishlist.url;
  content.videogames.wishlist = wishlist.games.map(game => gameCard(game, IGDB_WISHLIST));
  const ownedUrls = new Set(content.videogames.owned
    .filter(entry => entry.platform === IGDB_WISHLIST.platform)
    .map(entry => entry.url));
  for (const game of content.videogames.wishlist) {
    if (ownedUrls.has(game.url)) {
      report.push(`videogames: on the wishlist but already owned — ${game.name}`);
    }
  }
}

const TITLE_STOPWORDS = new Set(['the', 'a', 'an', 'of', 'and', 'to', 'in', 'for', 'with', 'by', 'vol']);
const TITLE_MATCH = 0.75;

function titleWords(text) {
  const words = text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(word => word && !TITLE_STOPWORDS.has(word));
  return new Set(words);
}

// Share of the shorter title's words that the longer one also has
function titleOverlap(left, right) {
  const smaller = left.size <= right.size ? left : right;
  const larger = smaller === left ? right : left;
  if (smaller.size === 0) {
    return 0;
  }
  let shared = 0;
  for (const word of smaller) {
    if (larger.has(word)) {
      shared++;
    }
  }
  return shared / smaller.size;
}

// Best candidate above the overlap threshold; Jaccard breaks ties between near-identical product names
function closestByTitle(entries, words) {
  let best = null;
  let bestScore = 0;
  for (const entry of entries) {
    const entryWords = titleWords(entry.name);
    if (titleOverlap(words, entryWords) < TITLE_MATCH) {
      continue;
    }
    const shared = [...words].filter(word => entryWords.has(word)).length;
    const score = shared / (words.size + entryWords.size - shared);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return best;
}

// Goodreads titles carry series suffixes, seller noise in brackets and, for Japanese editions,
// the romanised title in trailing brackets
function goodreadsTitle(book) {
  const romanised = book.title.match(/^[^\x00-\x7F].*\[([^\]]+)\]\s*$/);
  if (romanised) {
    return romanised[1];
  }
  return book.title.replace(/^\[+\(?/, '').replace(/^By [^-]+ - /i, '').split(/\]|\s*\([^)]*#\d+\)/)[0].trim();
}

function findSiteBook(books, book) {
  const title = goodreadsTitle(book);
  const full = titleWords(title.split(/[(\[]/)[0]);
  const short = titleWords(title.split(/[:?(\[]| - /)[0]);
  return books.find(entry => {
    if (entry.asin && [book.isbn, book.asin].includes(entry.asin)) {
      return true;
    }
    // Cards created from Goodreads are matched by id only, or two volumes would fold into one
    if (entry.goodreadsId) {
      return false;
    }
    const name = titleWords(entry.name.split(' (')[0]);
    if (name.size < 2 && full.size < 2) {
      return [...name][0] === [...full][0];
    }
    if (titleOverlap(full, name) >= TITLE_MATCH) {
      return true;
    }
    return short.size > 2 && titleOverlap(short, name) >= TITLE_MATCH;
  });
}

function goodreadsAuthor(book) {
  const [last, first] = book.author.split(', ');
  return first ? `${first} ${last}` : last;
}

function syncGoodreadsShelf(content, books, status, overrides) {
  for (const book of books) {
    const title = goodreadsTitle(book);
    const hit = matchSeries({ asin: book.isbn, title }, overrides);
    if (hit && status === 'owned') {
      const series = content.books.manga.find(entry => entry.series === hit.def.series);
      const volume = series && series.volumes.find(entry => entry.vol === hit.vol);
      if (volume) {
        volume.status = 'owned';
        volume.goodreads = book.url;
        volume.img = volume.img || book.img;
        continue;
      }
    }
    const existing = findSiteBook(content.books.normal, book);
    if (existing) {
      if (existing.status !== status) {
        report.push(`books: Goodreads says ${status}, site says ${existing.status} — ${existing.name}`);
      }
      existing.goodreads = book.url;
      existing.img = existing.img || book.img;
      continue;
    }
    const item = { title, asin: book.isbn || book.asin };
    content.books.normal.push({
      name: `${shortTitle(title)} (${goodreadsAuthor(book)})`,
      category: bookCategory(item, overrides, overrides.defaultCategory),
      status,
      img: book.img,
      url: book.url,
      goodreads: book.url,
      goodreadsId: book.id
    });
  }
}

function syncGoodreads(content, goodreads, overrides) {
  content.books.goodreadsUrl = goodreads.url;
  // Rebuilt each run so a renamed or re-shelved book does not leave a stale card behind
  content.books.normal = content.books.normal.filter(entry => !entry.goodreadsId);
  syncGoodreadsShelf(content, goodreads.shelves['my-bookcase'], 'owned', overrides);
  syncGoodreadsShelf(content, goodreads.shelves['my-wishlist'], 'wanted', overrides);
}

function legoTheme(id, overrides) {
  return overrides.themes[id] || overrides.defaultTheme;
}

function syncLegoOwned(content, lego, overrides) {
  // Gifted sets are the one case where a card is removed: the override is an explicit instruction
  content.lego.owned = content.lego.owned.filter(entry => !overrides.gifted.includes(String(entry.id)));
  const owned = content.lego.owned;
  const bought = lego.orders.flatMap(order => order.items).filter(item => !overrides.gifted.includes(item.id));
  for (const set of [...lego.collection, ...bought]) {
    const existing = owned.find(entry => String(entry.id) === set.id);
    if (existing) {
      existing.img = existing.img || set.img;
      continue;
    }
    // A set that was on the wishlist keeps the theme and shop link it had there
    const wished = content.lego.wishlist.find(entry => String(entry.id) === set.id) || {};
    const card = { id: set.id, name: set.name, img: set.img, theme: wished.theme || legoTheme(set.id, overrides) };
    const url = set.url || wished.url;
    if (url) {
      card.url = url;
    }
    owned.push(card);
    report.push(`lego: added to owned — ${set.id} ${set.name}`);
  }
}

function syncLegoWishlist(content, lego, overrides) {
  const ownedIds = new Set(content.lego.owned.map(entry => String(entry.id)));
  const listedIds = new Set(lego.wishlist.map(item => item.id));
  for (const entry of content.lego.wishlist) {
    if (!listedIds.has(String(entry.id))) {
      report.push(`lego: on site wishlist but not on LEGO.com wishlist — ${entry.id} ${entry.name}`);
    }
  }
  const siteOnly = content.lego.wishlist.filter(entry => !listedIds.has(String(entry.id)) && !ownedIds.has(String(entry.id)));
  const synced = [];
  for (const item of lego.wishlist) {
    if (ownedIds.has(item.id)) {
      report.push(`lego: bought but still on LEGO.com wishlist — ${item.id} ${item.name}`);
      continue;
    }
    const existing = content.lego.wishlist.find(entry => String(entry.id) === item.id) || {};
    const card = {
      id: item.id,
      name: item.name,
      price: item.salePrice || item.price,
      status: item.status,
      img: item.img,
      url: item.url,
      theme: existing.theme || legoTheme(item.id, overrides)
    };
    if (!card.status) {
      delete card.status;
    }
    synced.push(card);
  }
  content.lego.wishlist = [...synced, ...siteOnly];
}

function syncLego(content, lego, overrides) {
  content.lego.wishlistUrls = lego.urls;
  delete content.lego.officialWishlistUrl;
  syncLegoOwned(content, lego, overrides);
  syncLegoWishlist(content, lego, overrides);
}

function reportBgg(content, bgg) {
  const { owned, wishlist } = content.boardgames;
  const siteIds = new Map();
  for (const [games, isOwned] of [[owned, true], [wishlist, false]]) {
    for (const game of games) {
      siteIds.set(String(game.bggId), isOwned);
      for (const expansion of game.expansions || []) {
        siteIds.set(String(expansion.bggId), isOwned);
      }
    }
  }
  content.boardgames.bggUrl = bgg.url;
  const covers = new Map([...bgg.items.map(item => [item.id, item.img]), ...Object.entries(bgg.extraCovers || {})]);
  for (const game of [...owned, ...wishlist]) {
    game.img = game.img || covers.get(String(game.bggId)) || '';
  }
  for (const item of bgg.items) {
    if (!siteIds.has(item.id)) {
      report.push(`boardgames: on BGG but not on site — ${item.name} (${item.id})`);
      continue;
    }
    if (siteIds.get(item.id) !== item.owned) {
      report.push(`boardgames: BGG says ${item.owned ? 'owned' : 'not owned'}, site says ${item.owned ? 'wanted' : 'owned'} — ${item.name}`);
    }
  }
}

function upsertJunkCategory(content, category) {
  const categories = content.junk.categories;
  const index = categories.findIndex(entry => entry.id === category.id);
  if (index === -1) {
    categories.push(category);
    return;
  }
  categories[index] = category;
}

function syncKitchen(content, list) {
  upsertJunkCategory(content, {
    id: 'amazon-kitchen',
    name: 'Kitchen Wishlist \ud83c\udf73',
    icon: '\ud83c\udf73',
    description: `Synced from the Amazon "${list.name}" wishlist.`,
    url: list.url,
    items: list.items.map(item => ({
      id: item.asin,
      name: shortTitle(item.title),
      theme: 'Kitchen',
      price: formatPrice(item.price),
      img: item.img,
      url: item.url,
      notes: item.byline
    }))
  });
}

function syncNintendo(content, nintendo, overrides) {
  upsertJunkCategory(content, {
    id: 'nintendo-store',
    name: 'My Nintendo Store Wishlist \ud83c\udf44',
    icon: '\ud83c\udf44',
    description: 'Synced from the My Nintendo Store wishlist.',
    url: nintendo.url,
    items: nintendo.wishlist.map(item => ({
      id: item.id,
      name: item.name,
      theme: item.status || 'Nintendo',
      price: item.price,
      img: item.img,
      url: item.url || nintendo.url,
      notes: item.status
    }))
  });

  // Items Alec asked to take off the Zelda page stay off, even while the store wishlist still has them
  const removed = overrides.removed.map(name => ({ name }));
  content.zelda.wishlist = content.zelda.wishlist.filter(entry => !overrides.removed.includes(entry.name));
  const { owned, wishlist } = content.zelda;
  for (const item of nintendo.wishlist.filter(entry => /zelda/i.test(entry.name))) {
    const words = titleWords(item.name);
    if (closestByTitle(removed, words)) {
      continue;
    }
    // Wishlist first: owned TotK-edition hardware shares most words with the 40th-anniversary items
    const existing = closestByTitle(wishlist, words);
    if (existing) {
      existing.price = item.price;
      existing.img = item.img;
      existing.url = item.url || existing.url;
      continue;
    }
    if (closestByTitle(owned, words)) {
      report.push(`zelda: on the Nintendo wishlist but already owned — ${item.name}`);
      continue;
    }
    wishlist.push({ name: item.name, price: item.price, url: item.url || nintendo.url, img: item.img });
  }
}

function syncShop(content, shop) {
  const items = Object.values(shop.collections).flat().concat(shop.saved);
  upsertJunkCategory(content, {
    id: 'shop-app-stuff',
    name: 'Shop.app Saved \ud83d\udecd\ufe0f',
    icon: '\ud83d\udecd\ufe0f',
    description: 'Synced from Shop.app collections and saved items.',
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      theme: item.merchant,
      price: item.price,
      img: item.img,
      url: item.url,
      notes: item.notes
    }))
  });
}

function syncHubBadges(content) {
  const lego = content.index.collectionHubs.find(hub => hub.href === 'lego.html');
  if (!lego) {
    return;
  }
  lego.badge = `${content.lego.owned.length} Sets`;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const content = loadContent();
  const amazon = JSON.parse(fs.readFileSync(AMAZON_FILE, 'utf8'));
  const overrides = JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8'));

  movePurchasedBoardgames(content, overrides.boardgames.purchased);
  syncBoardgames(content, amazon.lists.boardgames, overrides.boardgames);
  syncBooks(content, amazon.lists.books, overrides.books);
  syncKitchen(content, amazon.lists.kitchen);
  syncGames(content, JSON.parse(fs.readFileSync(IGDB_FILE, 'utf8')), overrides.videogames);
  syncNintendo(content, JSON.parse(fs.readFileSync(NINTENDO_FILE, 'utf8')), overrides.zelda);
  syncGoodreads(content, JSON.parse(fs.readFileSync(GOODREADS_FILE, 'utf8')), overrides.books);
  syncLego(content, JSON.parse(fs.readFileSync(LEGO_FILE, 'utf8')), overrides.lego);
  reportBgg(content, JSON.parse(fs.readFileSync(BGG_FILE, 'utf8')));
  syncShop(content, JSON.parse(fs.readFileSync(SHOP_FILE, 'utf8')));
  syncHubBadges(content);
  content.meta.updatedAt = amazon.scrapedAt.slice(0, 10);

  report.forEach(line => console.log(`[Build] ${line}`));
  if (dryRun) {
    console.log('[Build] Dry run — js/content.js not written');
    return;
  }
  saveContent(content);
  console.log(`[Build] Wrote ${CONTENT_FILE}`);
}

main();
