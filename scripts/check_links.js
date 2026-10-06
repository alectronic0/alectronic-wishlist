#!/usr/bin/env node

/**
 * Link Checker
 *
 * Requests every URL in js/content.js and lists the ones that do not resolve.
 *
 * Usage:
 *   node scripts/check_links.js                  # all hosts
 *   node scripts/check_links.js --host amazon    # hosts containing "amazon"
 */

const path = require('path');

const CONTENT_FILE = path.join(__dirname, '..', 'js', 'content.js');
const PER_HOST = 3;
const TIMEOUT_MS = 20000;
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,image/*,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9'
};
// Bot walls answer these to scripts even when the page is fine in a browser
const BLOCKED_STATUSES = [401, 403, 429, 503];

function collectUrls(node, trail, found) {
  if (typeof node === 'string') {
    for (const match of node.matchAll(/https?:\/\/[^\s"'<>]+/g)) {
      if (!found.has(match[0])) {
        found.set(match[0], trail);
      }
    }
    return;
  }
  if (node === null || typeof node !== 'object') {
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    const label = value && value.name ? `${trail}/${value.name}` : `${trail}/${key}`;
    collectUrls(value, label, found);
  }
}

async function statusOf(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
    await res.body?.cancel();
    return res.status;
  } catch (err) {
    return err.name === 'TimeoutError' ? 'timeout' : 'error';
  }
}

async function checkHost(urls, results) {
  const queue = [...urls];
  const worker = async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      results.set(url, await statusOf(url));
    }
  };
  await Promise.all(Array.from({ length: PER_HOST }, worker));
}

async function main() {
  const hostFlag = process.argv.indexOf('--host');
  const hostFilter = hostFlag === -1 ? '' : process.argv[hostFlag + 1];

  global.window = {};
  require(CONTENT_FILE);
  const found = new Map();
  collectUrls(global.window.SITE_CONTENT, '', found);

  const byHost = new Map();
  for (const url of found.keys()) {
    const host = new URL(url).host;
    if (!host.includes(hostFilter)) {
      continue;
    }
    byHost.set(host, [...(byHost.get(host) || []), url]);
  }

  const results = new Map();
  await Promise.all([...byHost.values()].map(urls => checkHost(urls, results)));

  const dead = [];
  const blocked = [];
  for (const [url, status] of results) {
    if (status === 200) {
      continue;
    }
    const line = `${status}  ${url}  (${found.get(url)})`;
    if (BLOCKED_STATUSES.includes(status)) {
      blocked.push(line);
      continue;
    }
    dead.push(line);
  }

  blocked.forEach(line => console.log(`[Links] UNVERIFIED ${line}`));
  dead.forEach(line => console.log(`[Links] DEAD ${line}`));
  console.log(`[Links] ${results.size} checked, ${dead.length} dead, ${blocked.length} unverified (bot-walled)`);
  if (dead.length > 0) {
    process.exit(1);
  }
}

main();
