/**
 * CDP helper for the sync scripts.
 *
 * Drives the signed-in automation Chrome (port 9222) through ~/.agent/scripts/cdp_bridge.py.
 * Each call opens its own tab and closes it afterwards, so the user's tabs are never navigated.
 */

const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const CDP_BRIDGE = path.join(os.homedir(), '.agent', 'scripts', 'cdp_bridge.py');
const POWERSHELL = '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
const DEVTOOLS = 'http://localhost:9222';
const LOAD_WAIT_MS = 8000;

function powershell(command) {
  // cwd must be a Windows path or PowerShell prints a UNC warning into stdout
  return execFileSync(POWERSHELL, ['-NoProfile', '-Command', command], { encoding: 'utf8', cwd: '/mnt/c' }).trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function evaluate(urlFilter, expression) {
  const stdout = execFileSync('python3', [CDP_BRIDGE, 'eval', urlFilter, expression], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });
  let value = JSON.parse(stdout);
  // The bridge prints the evaluated string JSON-encoded, so a JSON payload is encoded twice
  if (typeof value === 'string') {
    value = JSON.parse(value);
  }
  return value;
}

/**
 * Opens `url` in a new tab, evaluates `expression` there (it must return a JSON string) and closes the tab.
 */
async function evalInNewTab(url, expression, waitMs = LOAD_WAIT_MS) {
  const tabId = powershell(`(Invoke-RestMethod -Method Put -Uri '${DEVTOOLS}/json/new?${url}').id`);
  try {
    await sleep(waitMs);
    // The bridge finds tabs by URL, and sites redirect or rewrite it, so ask Chrome where the tab ended up.
    // Another tab on the same URL would serve equally well: these scripts only read.
    const landedUrl = powershell(`((Invoke-RestMethod -Uri '${DEVTOOLS}/json/list') | Where-Object { $_.id -eq '${tabId}' }).url`);
    return evaluate(landedUrl.replace(/[\[\]]/g, '?'), expression);
  } finally {
    powershell(`Invoke-RestMethod -Uri '${DEVTOOLS}/json/close/${tabId}' | Out-Null`);
  }
}

module.exports = { evalInNewTab };
