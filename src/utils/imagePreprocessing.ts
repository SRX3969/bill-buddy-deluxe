import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

const MAX_IMAGE_DIMENSION = 1024;

export interface PreprocessedImage {
  canvas: HTMLCanvasElement;
  dataUrl: string;
}

// Resize image if needed
function resizeImageIfNeeded(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement
): boolean {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

// Apply contrast enhancement
function enhanceContrast(imageData: ImageData, factor: number = 1.5): ImageData {
  const data = imageData.data;
  const contrast = (factor - 1) * 255;
  const intercept = 128 * (1 - factor);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] * factor + intercept;     // R
    data[i + 1] = data[i + 1] * factor + intercept; // G
    data[i + 2] = data[i + 2] * factor + intercept; // B
  }

  return imageData;
}

// Apply adaptive thresholding
function applyAdaptiveThreshold(imageData: ImageData): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // Convert to grayscale first
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  // Simple local thresholding
  const windowSize = 15;
  const newData = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;

      for (let wy = Math.max(0, y - windowSize); wy < Math.min(height, y + windowSize); wy++) {
        for (let wx = Math.max(0, x - windowSize); wx < Math.min(width, x + windowSize); wx++) {
          const idx = (wy * width + wx) * 4;
          sum += data[idx];
          count++;
        }
      }

      const threshold = sum / count - 10;
      const idx = (y * width + x) * 4;
      const value = data[idx] > threshold ? 255 : 0;
      newData[idx] = newData[idx + 1] = newData[idx + 2] = value;
    }
  }

  for (let i = 0; i < data.length; i++) {
    data[i] = newData[i];
  }

  return imageData;
}

// Apply sharpening filter
function sharpenImage(imageData: ImageData): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const newData = new Uint8ClampedArray(data);

  // Sharpening kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[idx] * kernel[kernelIdx];
          }
        }
        const idx = (y * width + x) * 4 + c;
        newData[idx] = Math.max(0, Math.min(255, sum));
      }
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    data[i] = newData[i];
    data[i + 1] = newData[i + 1];
    data[i + 2] = newData[i + 2];
  }

  return imageData;
}

// Remove background using AI
export async function removeBackground(imageElement: HTMLImageElement): Promise<Blob> {
  try {
    console.log('Removing background...');
    const segmenter = await pipeline(
      'image-segmentation',
      'Xenova/segformer-b0-finetuned-ade-512-512',
      { device: 'webgpu' }
    );

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    resizeImageIfNeeded(canvas, ctx, imageElement);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    const result = await segmenter(imageData);

    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
      throw new Error('Invalid segmentation result');
    }

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) throw new Error('Could not get output canvas context');

    outputCtx.drawImage(canvas, 0, 0);
    const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const data = outputImageData.data;

    for (let i = 0; i < result[0].mask.data.length; i++) {
      const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
      data[i * 4 + 3] = alpha;
    }

    outputCtx.putImageData(outputImageData, 0, 0);

    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
}

// Main preprocessing function
export async function preprocessImage(
  imageDataUrl: string,
  options: {
    removeBackground?: boolean;
    enhanceContrast?: boolean;
    sharpen?: boolean;
    threshold?: boolean;
  } = {}
): Promise<PreprocessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        let currentImage = img;

        // Remove background if requested
        if (options.removeBackground) {
          try {
            const blob = await removeBackground(img);
            const url = URL.createObjectURL(blob);
            const bgRemovedImg = new Image();
            await new Promise((res, rej) => {
              bgRemovedImg.onload = res;
              bgRemovedImg.onerror = rej;
              bgRemovedImg.src = url;
            });
            currentImage = bgRemovedImg;
          } catch (error) {
            console.warn('Background removal failed, continuing without it:', error);
          }
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        resizeImageIfNeeded(canvas, ctx, currentImage);

        // Get image data for processing
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Apply contrast enhancement
        if (options.enhanceContrast !== false) {
          imageData = enhanceContrast(imageData, 1.8);
        }

        // Apply sharpening
        if (options.sharpen !== false) {
          imageData = sharpenImage(imageData);
        }

        // Apply adaptive thresholding
        if (options.threshold) {
          imageData = applyAdaptiveThreshold(imageData);
        }

        // Put processed image back
        ctx.putImageData(imageData, 0, 0);

        const dataUrl = canvas.toDataURL('image/png', 1.0);

        resolve({ canvas, dataUrl });
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}
