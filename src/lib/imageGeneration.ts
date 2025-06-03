import html2canvas from 'html2canvas';

// Test function to generate a simple image
export async function testImageGeneration(): Promise<void> {
  try {
    // Create a simple test element
    const testElement = document.createElement('div');
    testElement.id = 'test-image-generation';
    testElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 400px;
      height: 300px;
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
      color: white;
      font-family: Arial, sans-serif;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;
    testElement.textContent = 'Test Image Generation';
    
    document.body.appendChild(testElement);
    
    // Wait a moment for rendering
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Capture the test element
    const canvas = await html2canvas(testElement, {
      width: 400,
      height: 300,
      scale: 1,
      backgroundColor: null,
      logging: true
    });
    
    // Remove test element
    document.body.removeChild(testElement);
    
    // Convert to blob and download
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create test blob'));
        }
      }, 'image/png', 1.0);
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'test-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Test image generation failed:', error);
  }
}

export async function captureComponentAsImage(
  elementId: string,
  filename: string,
  width: number = 1600,
  height: number = 1000
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  try {
    
    // Make element visible for capture
    const originalPosition = element.style.position;
    const originalTop = element.style.top;
    const originalLeft = element.style.left;
    const originalZIndex = element.style.zIndex;
    const originalPointerEvents = element.style.pointerEvents;
    const originalOpacity = element.style.opacity;
    const originalVisibility = element.style.visibility;
    const originalTransform = element.style.transform;

    // Position element for capture (hidden but accessible to html2canvas)
    element.style.position = 'fixed';
    element.style.top = '0';
    element.style.left = '0';
    element.style.zIndex = '-999';
    element.style.pointerEvents = 'none';
    element.style.opacity = '1';
    element.style.visibility = 'visible';
    element.style.transform = 'translateX(-100vw)';

    // Wait for images to load
    await waitForImagesToLoad(element);
    
    // Additional wait for any async rendering and font loading
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Configure html2canvas options for high quality and proper text rendering
    const canvas = await html2canvas(element, {
      width: width,
      height: height,
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      imageTimeout: 20000,
      foreignObjectRendering: false,
      letterRendering: false,
      removeContainer: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: width,
      windowHeight: height,
      onclone: (clonedDoc, element) => {
        // Set proper encoding
        const metaCharset = clonedDoc.createElement('meta');
        metaCharset.setAttribute('charset', 'UTF-8');
        clonedDoc.head.insertBefore(metaCharset, clonedDoc.head.firstChild);
        
        // Ensure fonts are loaded in the cloned document
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * {
            font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
            -webkit-font-smoothing: subpixel-antialiased !important;
            -moz-osx-font-smoothing: auto !important;
            text-rendering: geometricPrecision !important;
            box-sizing: border-box !important;
            line-height: 1.6 !important;
          }
          body, html {
            font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.6 !important;
          }
          img {
            max-width: none !important;
            max-height: none !important;
            border: none !important;
          }
          .profile-image-card, .recommendations-image-card {
            font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
            -webkit-font-smoothing: subpixel-antialiased !important;
            -moz-osx-font-smoothing: auto !important;
            text-rendering: geometricPrecision !important;
            box-sizing: border-box !important;
            line-height: 1.6 !important;
          }
          div, span, p, h1, h2 {
            line-height: 1.6 !important;
            font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
          }
        `;
        clonedDoc.head.appendChild(style);

        // Ensure all images in the cloned document have proper src
        const images = clonedDoc.querySelectorAll('img');
        images.forEach((img, index) => {
          if (img.src && img.src.startsWith('blob:')) {
            // Convert blob URLs to data URLs for better compatibility
            try {
              const canvas = clonedDoc.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const originalImg = new Image();
              originalImg.crossOrigin = 'anonymous';
              originalImg.onload = function() {
                canvas.width = originalImg.width;
                canvas.height = originalImg.height;
                ctx?.drawImage(originalImg, 0, 0);
                img.src = canvas.toDataURL();
              };
              originalImg.src = img.src;
            } catch (e) {
              // Silent fail
            }
          }
        });
      }
    });


    // Restore original positioning
    element.style.position = originalPosition;
    element.style.top = originalTop;
    element.style.left = originalLeft;
    element.style.zIndex = originalZIndex;
    element.style.pointerEvents = originalPointerEvents;
    element.style.opacity = originalOpacity;
    element.style.visibility = originalVisibility;
    element.style.transform = originalTransform;

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas is empty or has zero dimensions');
    }

    // Convert canvas to blob with high quality
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/png', 1.0);
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error capturing component as image:', error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

// Helper function to wait for images to load
export function waitForImagesToLoad(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  
  if (images.length === 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let loadedCount = 0;
    const totalImages = images.length;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        resolve();
      }
    };

    images.forEach((img, index) => {
      if (img.complete && img.naturalHeight !== 0) {
        checkAllLoaded();
      } else {
        img.addEventListener('load', () => {
          checkAllLoaded();
        });
        img.addEventListener('error', (e) => {
          checkAllLoaded(); // Count errors as "loaded" to prevent hanging
        });
      }
    });
  });
}

// Helper function to ensure fonts are loaded
export function waitForFontsToLoad(): Promise<void> {
  if ('fonts' in document) {
    return document.fonts.ready;
  }
  
  // Fallback for browsers without FontFace API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 2000);
  });
} 
