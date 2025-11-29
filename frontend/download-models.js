const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsDir = path.join(__dirname, 'public', 'models');

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const models = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-weights_shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-weights_shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-weights_shard1',
  'face_recognition_model-weights_shard2',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-weights_shard1'
];

const baseUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

const downloadFile = (url, filePath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${path.basename(filePath)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file on error
      reject(err);
    });
  });
};

const downloadModels = async () => {
  console.log('Starting model download...');
  for (const model of models) {
    const url = baseUrl + model;
    const filePath = path.join(modelsDir, model);
    
    try {
      await downloadFile(url, filePath);
    } catch (err) {
      console.error(`Error downloading ${model}:`, err.message);
    }
  }
  console.log('Model download complete!');
};

downloadModels();
