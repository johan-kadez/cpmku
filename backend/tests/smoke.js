import assert from 'node:assert/strict';
import {productId} from '../src/utils/productId.js';
const id=productId();
assert.match(id,/^[a-z]{5}-[a-z]{5}$/);
console.log('Smoke test passed:',id);
