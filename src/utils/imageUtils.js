/**
 * Utility to compress images on the client side
 */

/**
 * Compresses an image from a data URL
 * @param {string} dataUrl - The base64 data URL of the image
 * @param {number} maxWidth - Maximum width of the compressed image
 * @param {number} quality - Compression quality (0 to 1)
 * @returns {Promise<string>} - Compressed base64 data URL
 */
export async function compressImage(dataUrl, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Get compressed data URL
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.onerror = (err) => reject(err);
  });
}

/**
 * Converts a File object to base64 data URL
 * @param {File} file 
 * @returns {Promise<string>}
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}
