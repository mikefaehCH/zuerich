// Regression: cache cleanup must not affect other apps on the same origin.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const handlers = {};
const deleted = [];
const self = { addEventListener: (name, fn) => { handlers[name] = fn; }, clients: { claim: async () => {} } };
const caches = { keys: async () => ['zuerich-v18','zuerich-v19','camino-v49','camino-fotos','sommer2027-v23'], delete: async key => { deleted.push(key); return true; } };
vm.runInNewContext(source, { self, caches, Promise, URL });
let pending;
handlers.activate({ waitUntil: p => { pending = p; } });
await pending;
assert.deepEqual(deleted, ['zuerich-v18']);
console.log('PASS: Zuerich only removes its obsolete own cache');
