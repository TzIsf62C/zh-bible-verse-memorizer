#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

function usage() {
  console.error('Usage: node scripts/migration/stage-host-content.mjs <legacy|refactor> [hostDir]');
  process.exit(2);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function clearDirContents(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const name of fs.readdirSync(dirPath)) {
    fs.rmSync(path.join(dirPath, name), { recursive: true, force: true });
  }
}

function copyDirContents(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      copyDirContents(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

function stageLegacy(destDir) {
  const legacyDir = path.join(ROOT, 'legacy');
  if (!fs.existsSync(legacyDir)) {
    throw new Error('Missing legacy directory: legacy');
  }

  copyDirContents(legacyDir, destDir);
  return legacyDir;
}

function stageRefactor(destDir) {
  const buildDir = path.join(ROOT, 'build');
  if (!fs.existsSync(buildDir)) {
    throw new Error('Missing build directory. Run npm run build first.');
  }

  copyDirContents(buildDir, destDir);
  return buildDir;
}

function main() {
  const mode = process.argv[2];
  if (!mode || !['legacy', 'refactor'].includes(mode)) usage();

  const hostDir = process.argv[3] || '/tmp/zbvm-migration-host';
  const resolvedHostDir = path.resolve(hostDir);

  ensureDir(resolvedHostDir);
  clearDirContents(resolvedHostDir);

  const source = mode === 'legacy'
    ? stageLegacy(resolvedHostDir)
    : stageRefactor(resolvedHostDir);

  console.log('Host staging complete');
  console.log('=====================');
  console.log(`Mode: ${mode}`);
  console.log(`Source: ${source}`);
  console.log(`Host dir: ${resolvedHostDir}`);
}

main();
