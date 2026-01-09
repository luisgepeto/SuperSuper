// Image utility functions for resizing and compressing images

/**
 * Compress and resize an image from a data URL
 * @param {string} dataUrl - The source data URL from camera capture
 * @param {number} maxWidth - Maximum width in pixels (default: 200)
 * @param {number} maxHeight - Maximum height in pixels (default: 200)
 * @param {number} quality - JPEG quality 0-1 (default: 0.7)
 * @returns {Promise<string>} Compressed image as base64 data URL
 * @throws {Error} Rejects with error if image fails to load (e.g., invalid dataUrl)
 */
export const compressImage = (dataUrl, maxWidth = 200, maxHeight = 200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to compressed JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    img.src = dataUrl;
  });
};

/**
 * Fetch an external image URL and compress it to a base64 data URL
 * This stores the image locally to avoid repeated API calls
 * @param {string} imageUrl - The external image URL to fetch and compress
 * @param {number} maxWidth - Maximum width in pixels (default: 200)
 * @param {number} maxHeight - Maximum height in pixels (default: 200)
 * @param {number} quality - JPEG quality 0-1 (default: 0.7)
 * @returns {Promise<string|null>} Compressed image as base64 data URL, or null if fetch fails
 */
export const fetchAndCompressImage = async (imageUrl, maxWidth = 200, maxHeight = 200, quality = 0.7) => {
  if (!imageUrl) {
    return null;
  }

  try {
    // Fetch the image as a blob
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('Failed to fetch image:', response.status);
      return null;
    }

    const blob = await response.blob();
    
    // Convert blob to data URL
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read image blob'));
      reader.readAsDataURL(blob);
    });

    // Compress the image
    const compressedDataUrl = await compressImage(dataUrl, maxWidth, maxHeight, quality);
    return compressedDataUrl;
  } catch (error) {
    console.error('Error fetching and compressing image:', error);
    return null;
  }
};

/**
 * Capture image from video stream element
 * @param {HTMLVideoElement} videoElement - The video element with active stream
 * @returns {string} Captured image as data URL
 * @throws {Error} May throw if videoElement is invalid or video dimensions are 0
 */
export const captureFromVideo = (videoElement) => {
  if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    throw new Error('Video element is not ready for capture');
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0);
  
  return canvas.toDataURL('image/jpeg', 0.9);
};
