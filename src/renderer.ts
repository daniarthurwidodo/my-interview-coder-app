/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';

declare global {
  interface Window {
    electronAPI: { captureScreens: () => Promise<string[]> };
  }
}

const captureButton = document.getElementById('capture-button') as HTMLButtonElement;
const capturePreviews = document.getElementById('capture-previews') as HTMLDivElement;
const captureError = document.getElementById('capture-error') as HTMLParagraphElement;

function createPreviewImage(dataUrl: string, index: number): HTMLImageElement {
  const image = document.createElement('img');
  image.src = dataUrl;
  image.alt = `Screenshot of screen ${index + 1}`;
  return image;
}

async function handleCaptureClick(): Promise<void> {
  captureButton.disabled = true;
  captureError.textContent = '';
  try {
    const screenshots = await window.electronAPI.captureScreens();
    capturePreviews.replaceChildren(...screenshots.map(createPreviewImage));
  } catch (error) {
    captureError.textContent = `Screenshot failed: ${
      error instanceof Error ? error.message : String(error)
    }`;
  } finally {
    captureButton.disabled = false;
  }
}

captureButton.addEventListener('click', handleCaptureClick);
