import { createLocalStorageStore } from './localStorage.js';

export const collections = createLocalStorageStore('collections', []);
