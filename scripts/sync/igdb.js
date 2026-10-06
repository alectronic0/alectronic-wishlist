#!/usr/bin/env node

/**
 * IGDB List Sync
 *
 * IGDB is the source of truth for games. Lists are read as CSV exports from the signed-in
 * automation Chrome over CDP (private lists need the session), then covers and slugs are
 * filled in from the IGDB API.
 *
 * Requires: automation Chrome running on port 9222 and signed in to IGDB;
 *           TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET in the environment.
 *
 * Usage:
 *   node scripts/sync/igdb.js
 */

const fs = require('fs');
const path = require('path');
const { evalInNewTab } = require('./cdp');

const USER = 'alectronic0';
const PROFILE_URL = `https://www.igdb.com/users/${USER}`;
const OUTPUT_FILE = path.join(__dirname, '..', '..', 'data', 'sources', 'igdb.json');
const API_CHUNK = 500;
const LISTS = [
  'steam',
  'steam-wishlist',
  'nintendo-switch-1-and-2',
  'nintendo-wii-u',
  'nintendo-wii',
  'nintendo-gamecube',
  'nintendo-64',
  'nintendo-3ds',
  'nintendo-ds',
  'game-boy-advance',
  'game-boy-and-game-boy-colour',
  'nintendo-snes',
  'nintendo-nes'
];

// Runs inside the IGDB tab. Only id and name are returned: the CSV's description column
// would push the reply past the bridge's message buffer.
const PAGE_SCRIPT = `(async () => {
  const parseCsv = text => {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; continue; }
        if (char === '"') { quoted = false; continue; }
        cell += char;
        continue;
      }
      if (char === '"') { quoted = true; continue; }
      if (char === ',') { row.push(cell); cell = ''; continue; }
      if (char === '\\n') { row.push(cell); rows.push(row); row = []; cell = ''; continue; }
      if (char === '\\r') { continue; }
      cell += char;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  };
  const out = {};
  for (const slug of ${JSON.stringify(LISTS)}) {
    const res = await fetch('/users/${USER}/lists/' + slug + '.csv', { credentials: 'include' });
    if (!res.ok) { out[slug] = { error: res.status }; continue; }
    const rows = parseCsv(await res.text()).slice(1).filter(row => row.length > 1);
    out[slug] = { games: rows.map(row => ({ id: Number(row[0]), name: row[1] })) };
  }
  return JSON.stringify(out);
})()`;

async function apiToken() {
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    grant_type: 'client_credentials'
  });
  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Twitch token: HTTP ${res.status}`);
  }
  return (await res.json()).access_token;
}

async function fetchGameDetails(ids, token) {
  const details = new Map();
  for (let start = 0; start < ids.length; start += API_CHUNK) {
    const chunk = ids.slice(start, start + API_CHUNK);
    const res = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID, 'Authorization': `Bearer ${token}` },
      body: `fields name,slug,cover.image_id; where id = (${chunk.join(',')}); limit ${API_CHUNK};`
    });
    if (!res.ok) {
      throw new Error(`IGDB games: HTTP ${res.status}`);
    }
    for (const game of await res.json()) {
      details.set(game.id, game);
    }
  }
  return details;
}

function enrich(game, details) {
  const detail = details.get(game.id);
  if (!detail) {
    return { ...game, slug: '', img: '', url: '' };
  }
  return {
    id: game.id,
    name: detail.name,
    slug: detail.slug,
    img: detail.cover ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${detail.cover.image_id}.jpg` : '',
    url: `https://www.igdb.com/games/${detail.slug}`
  };
}

async function main() {
  if (!process.env.TWITCH_CLIENT_ID) {
    throw new Error('TWITCH_CLIENT_ID is not set');
  }
  const raw = await evalInNewTab(PROFILE_URL, PAGE_SCRIPT);
  for (const [slug, list] of Object.entries(raw)) {
    if (list.error) {
      throw new Error(`${slug}: HTTP ${list.error} — signed out or list renamed, snapshot not written`);
    }
  }

  const ids = [...new Set(Object.values(raw).flatMap(list => list.games.map(game => game.id)))];
  const details = await fetchGameDetails(ids, await apiToken());

  const lists = {};
  for (const slug of LISTS) {
    lists[slug] = {
      url: `https://www.igdb.com/users/${USER}/lists/${slug}`,
      games: raw[slug].games.map(game => enrich(game, details))
    };
    console.log(`[IgdbSync] ${slug}: ${lists[slug].games.length} games`);
  }
  const unresolved = Object.values(lists).flatMap(list => list.games).filter(game => !game.slug);
  if (unresolved.length > 0) {
    console.log(`[IgdbSync] ${unresolved.length} games not found by the API: ${unresolved.map(game => game.name).join(', ')}`);
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ scrapedAt: new Date().toISOString(), lists }, null, 2) + '\n');
  console.log(`[IgdbSync] Wrote ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error(`[IgdbSync] ${err.message}`);
  process.exit(1);
});
