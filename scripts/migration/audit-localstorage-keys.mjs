#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

const LEGACY_FILES = [
  path.join(ROOT, 'legacy', 'script.js'),
  path.join(ROOT, 'legacy', 'index.html')
];

const REFACTOR_ROOT = path.join(ROOT, 'src');
const REFACTOR_EXTENSIONS = new Set(['.js', '.svelte']);

const CATEGORY_MAP = {
  data: new Set(['verses', 'collections', 'settings', 'practice']),
  setting: new Set([
    'languagePreference',
    'inputMethod',
    'themePreference',
    'bookNameCharset',
    'defaultBibleVersion',
    'vibrationEnabled',
    'buzzerEnabled',
    'textSizePreference'
  ]),
  onboarding: new Set([
    'hasCompletedOnboarding',
    'hasVisitedBefore',
    'hasSeenAddVerseTutorial',
    'onboardingInProgress'
  ]),
  reminder: new Set([
    'firstBackupReminder',
    'lastBackupReminder',
    'backupReminderEnabled',
    'backupReminderWeeks',
    'lastExportDate',
    'lastBackupReminderShownDate'
  ]),
  update: new Set(['lastUpdateCheck'])
};

function getCategory(key) {
  for (const [category, keys] of Object.entries(CATEGORY_MAP)) {
    if (keys.has(key)) return category;
  }
  return 'other';
}

function collectFiles(dirPath, extensions) {
  const result = [];

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (extensions.has(path.extname(entry.name))) {
        result.push(fullPath);
      }
    }
  }

  walk(dirPath);
  return result;
}

function toRelative(absPath) {
  return path.relative(ROOT, absPath).split(path.sep).join('/');
}

function scanFiles(filePaths) {
  const keys = new Map();
  let clearCalls = 0;

  const keyRegex = /localStorage\.(getItem|setItem|removeItem)\(\s*['\"]([^'\"]+)['\"]/g;
  const storeFactoryRegex = /createLocalStorageStore\(\s*['\"]([^'\"]+)['\"]/g;
  const clearRegex = /localStorage\.clear\(\s*\)/g;

  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    const rel = toRelative(filePath);

    for (const match of content.matchAll(clearRegex)) {
      void match;
      clearCalls += 1;
    }

    for (const match of content.matchAll(keyRegex)) {
      const operation = match[1];
      const key = match[2];
      if (!keys.has(key)) {
        keys.set(key, {
          operations: new Set(),
          files: new Set()
        });
      }
      const entry = keys.get(key);
      entry.operations.add(operation);
      entry.files.add(rel);
    }

    for (const match of content.matchAll(storeFactoryRegex)) {
      const key = match[1];
      if (!keys.has(key)) {
        keys.set(key, {
          operations: new Set(),
          files: new Set()
        });
      }
      const entry = keys.get(key);
      entry.operations.add('storeFactory');
      entry.files.add(rel);
    }
  }

  return { keys, clearCalls };
}

function sortKeys(keys) {
  return Array.from(keys).sort((a, b) => a.localeCompare(b));
}

function printSection(title) {
  console.log(`\n${title}`);
  console.log('-'.repeat(title.length));
}

function printKeyDetails(keysMap, keyList) {
  for (const key of keyList) {
    const details = keysMap.get(key);
    const operations = sortKeys(details.operations);
    const category = getCategory(key);
    console.log(`- ${key} [${category}] (${operations.join(', ')})`);
  }
}

function main() {
  const refactorFiles = collectFiles(REFACTOR_ROOT, REFACTOR_EXTENSIONS);

  const legacy = scanFiles(LEGACY_FILES);
  const refactor = scanFiles(refactorFiles);

  const legacyKeys = sortKeys(legacy.keys.keys());
  const refactorKeys = sortKeys(refactor.keys.keys());

  const legacySet = new Set(legacyKeys);
  const refactorSet = new Set(refactorKeys);

  const shared = legacyKeys.filter((key) => refactorSet.has(key));
  const legacyOnly = legacyKeys.filter((key) => !refactorSet.has(key));
  const refactorOnly = refactorKeys.filter((key) => !legacySet.has(key));

  console.log('LocalStorage Schema Audit');
  console.log('========================');
  console.log(`Legacy files scanned: ${LEGACY_FILES.map(toRelative).join(', ')}`);
  console.log(`Refactor files scanned: ${refactorFiles.length}`);

  printSection('Shared Keys');
  printKeyDetails(legacy.keys, shared);

  printSection('Legacy-Only Keys');
  printKeyDetails(legacy.keys, legacyOnly);

  printSection('Refactor-Only Keys');
  printKeyDetails(refactor.keys, refactorOnly);

  printSection('Data-Critical Shared Keys');
  const critical = ['verses', 'collections'].filter((key) => legacySet.has(key) && refactorSet.has(key));
  for (const key of critical) {
    console.log(`- ${key}`);
  }

  printSection('localStorage.clear() Calls');
  console.log(`- Legacy clear() calls: ${legacy.clearCalls}`);
  console.log(`- Refactor clear() calls: ${refactor.clearCalls}`);

  printSection('Summary');
  console.log(`- Shared: ${shared.length}`);
  console.log(`- Legacy-only: ${legacyOnly.length}`);
  console.log(`- Refactor-only: ${refactorOnly.length}`);
}

main();
