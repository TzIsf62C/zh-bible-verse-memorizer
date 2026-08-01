#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const CRITICAL_KEYS = ['verses', 'collections'];
const IMPORTANT_SETTINGS_KEYS = [
  'languagePreference',
  'inputMethod',
  'themePreference',
  'bookNameCharset',
  'defaultBibleVersion',
  'vibrationEnabled',
  'backupReminderEnabled',
  'backupReminderWeeks',
  'lastExportDate',
  'textSizePreference',
  'lastUpdateCheck',
  'firstBackupReminder',
  'lastBackupReminder'
];

function usage() {
  const cmd = path.basename(process.argv[1] || 'compare-localstorage-snapshots.mjs');
  console.error(`Usage: node ${cmd} <baseline.json> <candidate.json>`);
  process.exit(2);
}

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');

  try {
    return JSON.parse(raw);
  } catch {
    return parseKeyValueDump(raw);
  }
}

function parseKeyValueDump(raw) {
  const output = {};
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line !== '{' && line !== '}');

  for (const line of lines) {
    if (/^key\s+value$/i.test(line)) {
      continue;
    }

    const match = line.match(/^([^\s]+)\s+(.+)$/);
    if (!match) {
      continue;
    }

    const key = match[1].trim();
    const value = match[2].trim();
    output[key] = value;
  }

  if (Object.keys(output).length === 0) {
    throw new Error(
      'Unsupported snapshot format. Use JSON object map, array of {key/name,value}, or DevTools key/value text dump.'
    );
  }

  return output;
}

function normalizeSnapshot(input) {
  if (Array.isArray(input)) {
    const output = {};
    for (const entry of input) {
      if (entry && typeof entry === 'object') {
        const key = entry.key ?? entry.name;
        const value = entry.value;
        if (typeof key === 'string') {
          output[key] = typeof value === 'string' ? value : JSON.stringify(value);
        }
      }
    }
    return output;
  }

  if (input && typeof input === 'object') {
    const output = {};
    for (const [key, value] of Object.entries(input)) {
      output[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return output;
  }

  throw new Error('Unsupported snapshot format. Use object map or array of {key,name,value}.');
}

function safeParseJson(raw) {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (error) {
    return { ok: false, error };
  }
}

function isLikelyTruncatedJson(raw) {
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;

  const startsJson = trimmed.startsWith('[') || trimmed.startsWith('{');
  const endsJson = trimmed.endsWith(']') || trimmed.endsWith('}');

  if (startsJson && !endsJson) return true;
  if (startsJson && trimmed.length >= 4096) return true;

  return false;
}

function toVerseSignature(verse) {
  if (!verse || typeof verse !== 'object') return 'invalid';
  if (verse.id) return `id:${verse.id}`;
  return `ref:${verse.bookName ?? ''}:${verse.chapterNumber ?? ''}:${verse.verseNumber ?? ''}`;
}

function toCollectionSignature(collection) {
  if (!collection || typeof collection !== 'object') return 'invalid';
  const ids = Array.isArray(collection.verseIds) ? collection.verseIds.join('|') : '';
  return `${collection.id ?? ''}:${collection.title ?? ''}:${ids}`;
}

function compareArraySemantics(baseArr, candArr, signatureFn) {
  const baseSet = new Set(baseArr.map(signatureFn));
  const candSet = new Set(candArr.map(signatureFn));

  const missing = [];
  for (const value of baseSet) {
    if (!candSet.has(value)) missing.push(value);
  }

  return {
    sameLength: baseArr.length === candArr.length,
    missing,
    baseLength: baseArr.length,
    candLength: candArr.length
  };
}

function main() {
  if (process.argv.length < 4) usage();

  const baselinePath = process.argv[2];
  const candidatePath = process.argv[3];

  const baseline = normalizeSnapshot(loadJson(baselinePath));
  const candidate = normalizeSnapshot(loadJson(candidatePath));

  const criticalFailures = [];
  const highFindings = [];
  const notes = [];

  for (const key of CRITICAL_KEYS) {
    if (!(key in baseline)) {
      criticalFailures.push(`Baseline missing critical key: ${key}`);
      continue;
    }

    if (!(key in candidate)) {
      criticalFailures.push(`Candidate missing critical key: ${key}`);
      continue;
    }

    const baseParsed = safeParseJson(baseline[key]);
    const candParsed = safeParseJson(candidate[key]);

    if (!baseParsed.ok) {
      const hint = isLikelyTruncatedJson(baseline[key])
        ? ' (looks truncated; export localStorage via DevTools Console JSON export instead of table copy)'
        : '';
      criticalFailures.push(`Baseline key ${key} is not valid JSON${hint}`);
      continue;
    }
    if (!candParsed.ok) {
      const hint = isLikelyTruncatedJson(candidate[key])
        ? ' (looks truncated; export localStorage via DevTools Console JSON export instead of table copy)'
        : '';
      criticalFailures.push(`Candidate key ${key} is not valid JSON${hint}`);
      continue;
    }

    if (!Array.isArray(baseParsed.value) || !Array.isArray(candParsed.value)) {
      criticalFailures.push(`Key ${key} should be a JSON array in both snapshots`);
      continue;
    }

    const compare = key === 'verses'
      ? compareArraySemantics(baseParsed.value, candParsed.value, toVerseSignature)
      : compareArraySemantics(baseParsed.value, candParsed.value, toCollectionSignature);

    if (!compare.sameLength) {
      criticalFailures.push(`Key ${key} length changed: baseline=${compare.baseLength}, candidate=${compare.candLength}`);
    }

    if (compare.missing.length > 0) {
      criticalFailures.push(`Key ${key} is missing ${compare.missing.length} baseline entries in candidate snapshot`);
    }
  }

  for (const key of IMPORTANT_SETTINGS_KEYS) {
    if (key in baseline && !(key in candidate) && !('settings' in candidate)) {
      highFindings.push(`Legacy setting key ${key} missing in candidate and no consolidated settings key found`);
    }
  }

  const baselineKeys = new Set(Object.keys(baseline));
  const candidateKeys = new Set(Object.keys(candidate));
  const added = [...candidateKeys].filter((key) => !baselineKeys.has(key)).sort();
  const removed = [...baselineKeys].filter((key) => !candidateKeys.has(key)).sort();

  notes.push(`Added keys: ${added.length ? added.join(', ') : '(none)'}`);
  notes.push(`Removed keys: ${removed.length ? removed.join(', ') : '(none)'}`);

  console.log('LocalStorage Snapshot Comparison');
  console.log('===============================');
  console.log(`Baseline: ${baselinePath}`);
  console.log(`Candidate: ${candidatePath}`);

  console.log('\nCritical Findings');
  console.log('-----------------');
  if (criticalFailures.length === 0) {
    console.log('- none');
  } else {
    for (const finding of criticalFailures) console.log(`- ${finding}`);
  }

  console.log('\nHigh Findings');
  console.log('-------------');
  if (highFindings.length === 0) {
    console.log('- none');
  } else {
    for (const finding of highFindings) console.log(`- ${finding}`);
  }

  console.log('\nNotes');
  console.log('-----');
  for (const note of notes) console.log(`- ${note}`);

  const exitCode = criticalFailures.length > 0 ? 1 : 0;
  console.log(`\nResult: ${exitCode === 0 ? 'PASS' : 'FAIL'}`);
  process.exit(exitCode);
}

main();
