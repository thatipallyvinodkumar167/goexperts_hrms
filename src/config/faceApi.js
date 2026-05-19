import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load the stable CommonJS build of face-api.js
const faceapi = require('face-api.js');
import { Canvas, Image, ImageData } from 'canvas';
import path from 'path';

// Monkey-patch the face-api environment to run correctly inside Node.js
// using the 'canvas' package instead of HTML5 browser APIs.
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let isLoaded = false;

/**
 * Loads the face-api.js neural network weights from disk into memory.
 * This runs once when the Express server starts.
 */
export const loadFaceApiModels = async () => {
  if (isLoaded) return;

  try {
    const modelsPath = path.resolve('public/models');

    console.log('⏰ Loading Face-API.js models from:', modelsPath);

    // Load optimized face-api neural networks
    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);

    isLoaded = true;
    console.log('✅ Face-API.js Models loaded successfully.');
  } catch (error) {
    console.error('❌ Failed to load Face-API.js models:', error.message);
  }
};

export default faceapi;