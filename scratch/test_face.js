import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const faceapi = require('face-api.js');
console.log("Original face-api.js loaded successfully!");
