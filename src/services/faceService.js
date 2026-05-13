import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js-models@master';

let modelsLoaded = false;

export const loadFaceModels = async () => {
  if (modelsLoaded) return;
  
  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(`${MODEL_URL}/ssd_mobilenetv1`),
      faceapi.nets.faceLandmark68Net.loadFromUri(`${MODEL_URL}/face_landmark_68`),
      faceapi.nets.faceRecognitionNet.loadFromUri(`${MODEL_URL}/face_recognition`)
    ]);
    modelsLoaded = true;
    console.log('Face models loaded successfully');
  } catch (err) {
    console.error('Error loading face models:', err);
    throw new Error('Gagal memuat modul pengenalan wajah. Periksa koneksi internet Anda.');
  }
};

/**
 * Extract face descriptor from an image element or video
 * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input 
 * @returns {Promise<Float32Array|null>}
 */
export const extractFaceDescriptor = async (input) => {
  await loadFaceModels();
  
  const detection = await faceapi
    .detectSingleFace(input)
    .withFaceLandmarks()
    .withFaceDescriptor();
    
  if (!detection) return null;
  
  return detection.descriptor;
};

/**
 * Compare two face descriptors
 * @param {Float32Array|Array} descriptor1 
 * @param {Float32Array|Array} descriptor2 
 * @returns {number} Distance (lower is more similar, typically < 0.6 is a match)
 */
export const compareFaces = (descriptor1, descriptor2) => {
  const d1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(Object.values(descriptor1));
  const d2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(Object.values(descriptor2));
  
  return faceapi.euclideanDistance(d1, d2);
};

export const isMatch = (descriptor1, descriptor2, threshold = 0.5) => {
  if (!descriptor1 || !descriptor2) return false;
  const distance = compareFaces(descriptor1, descriptor2);
  return distance < threshold;
};
