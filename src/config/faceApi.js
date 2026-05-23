import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load the stable CommonJS build of face-api.js
const faceapi = require('face-api.js');
import { Canvas, Image, ImageData } from 'canvas';
import path from 'path';
import fs from 'fs';
import https from 'https';

// Monkey-patch the face-api environment to run correctly inside Node.js
// using the 'canvas' package instead of HTML5 browser APIs.
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let isLoaded = false;

// Helper function to download files from raw URLs securely
const downloadModelFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download weight file: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

/**
 * Loads the face-api.js neural network weights from disk into memory.
 * This runs once when the Express server starts.
 */
export const loadFaceApiModels = async () => {
  if (isLoaded) return;

  try {
    const modelsPath = path.resolve('public/models');

    // Ensure models directory exists
    if (!fs.existsSync(modelsPath)) {
      fs.mkdirSync(modelsPath, { recursive: true });
    }

    // List of official weight files required for facial verification
    const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
    const filesToDownload = [
      'tiny_face_detector_model-weights_manifest.json',
      'tiny_face_detector_model-shard1',
      'ssd_mobilenetv1_model-weights_manifest.json',
      'ssd_mobilenetv1_model-shard1',
      'ssd_mobilenetv1_model-shard2',
      'face_landmark_68_model-weights_manifest.json',
      'face_landmark_68_model-shard1',
      'face_recognition_model-weights_manifest.json',
      'face_recognition_model-shard1',
      'face_recognition_model-shard2'
    ];


    // Download missing weight files dynamically
    for (const fileName of filesToDownload) {
      const filePath = path.join(modelsPath, fileName);
      if (!fs.existsSync(filePath)) {
        console.log(`📥 Model weight file missing. Downloading: ${fileName}...`);
        await downloadModelFile(`${baseUrl}${fileName}`, filePath);
      }
    }

    console.log('⏰ Loading Face-API.js models from:', modelsPath);

    // Load optimized face-api neural networks
    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath);
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);

    isLoaded = true;
    console.log('✅ Face-API.js Models loaded successfully.');
  } catch (error) {
    console.error('❌ Failed to load Face-API.js models:', error.message);
  }
};

export default faceapi;