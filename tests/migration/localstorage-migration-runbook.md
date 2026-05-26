# LocalStorage Migration Runbook (Legacy -> Refactor)

This runbook validates that a user can move from the legacy app to the refactored app on the same origin without data loss.

## Scope
- Required: key schema comparison.
- Required: same-origin host swap test (seed legacy localStorage, then serve refactor at same origin).
- Required: pass/fail criteria for release gate.

## Prerequisites
- One dedicated browser profile for this run.
- Local Node/npm environment.
- Ability to open browser DevTools (Application tab).

## 1. Generate Key Schema Report
Run the key-audit script to compare legacy and refactor localStorage usage.

```bash
npm run migration:keys
```

Record the output in your test notes.

## 2. Start Legacy App at Fixed Origin
Use one host+port and keep it unchanged for all phases.

Recommended (staged host workflow):

```bash
npm run migration:stage:legacy
npm run migration:serve
```

Default origin is http://localhost:8000.

Alternative direct legacy server:

```bash
cd legacy
./start-server.sh
```

Legacy server also defaults to http://localhost:8000.

## 3. Seed Legacy Data
At the fixed origin:
1. Add at least 5 verses across 2 books.
2. Create at least 2 collections and assign verses.
3. Complete some review actions so verse review metadata exists.
4. Change settings (language, input method, theme, text size, backup reminder toggle).

## 4. Capture Baseline Snapshot (Snapshot A)
In DevTools for the test origin:
1. Open Application -> Local Storage -> the test origin.
2. In DevTools Console, run this to export a full non-truncated JSON snapshot:

```js
copy(JSON.stringify(Object.fromEntries(Object.entries(localStorage)), null, 2));
```

3. Paste into a file named snapshotA.json.
4. Also run in-app export (Export & Import panel) and save backup file (Snapshot B).

Suggested JSON format for snapshot files:

```json
{
  "verses": "[...]",
  "collections": "[...]",
  "languagePreference": "english"
}
```

A ready template is available at [tests/migration/snapshot-format.example.json](tests/migration/snapshot-format.example.json).

## 5. Build Refactor App
From repository root:

```bash
npm run build
```

## 6. Swap Served Files on Same Origin
Stop legacy server, then replace served content with refactor output while keeping the same origin.

Recommended:

```bash
npm run migration:stage:refactor
npm run migration:serve
```

This stages build output into /tmp/zbvm-migration-host and serves it on the same default origin.

If you already use scripts, ensure final refactor hosting still resolves to the same origin URL used for legacy.

## 7. Neutralize Service Worker Cache (Do Not Clear localStorage)
Before first refactor validation load:
1. DevTools -> Application -> Service Workers -> Unregister all for this origin.
2. DevTools -> Application -> Cache Storage -> Delete caches for this origin.
3. Hard reload.

Do not clear Local Storage.

## 8. Validate Post-Swap Behavior
At the same origin with refactor served:
1. Confirm verses are present and count matches baseline.
2. Confirm collections and verse membership/order match baseline.
3. Confirm learn/review/data panels work with migrated data.
4. Confirm settings are preserved or correctly represented via consolidated settings key.
5. Confirm onboarding does not block normal use for migrated users with existing verses.

## 9. Capture Candidate Snapshots (Snapshot C and D)
- Snapshot C: immediately after first successful refactor load, using the same DevTools Console export command.
- Snapshot D: after basic interactions (open panels, change one setting, optional review action), again using the same export command.

## 10. Run Snapshot Comparator
Compare baseline vs candidate snapshot for critical data continuity.

```bash
npm run migration:compare -- ./snapshotA.json ./snapshotC.json
npm run migration:compare -- ./snapshotA.json ./snapshotD.json
```

## 11. Pass/Fail Criteria

### Critical (must be zero)
- Missing/corrupted verses key.
- Missing/corrupted collections key.
- Any baseline verse/collection entries lost.

### High (must be zero for release)
- Legacy settings no longer represented (neither as legacy keys nor consolidated settings).
- App unusable due to migration-side state mismatch.

### Medium (acceptable with note)
- Legacy-only non-critical keys remain after migration.
- Additional refactor-only keys are added with valid values.

## 12. Test Matrix (Repeat)
Run full flow for each dataset:
1. Small dataset (5-10 verses).
2. Medium dataset (30+ verses with multiple collections).
3. Mixed preferences (different language/input method/theme combinations).

## 13. Execution Record Template

| Run ID | Origin | Dataset | Snapshot A | Snapshot C | Snapshot D | Critical Findings | High Findings | Result |
|---|---|---|---|---|---|---|---|---|
| MIG-001 | http://localhost:8000 | Small | yes | yes | yes | 0 | 0 | PASS |

