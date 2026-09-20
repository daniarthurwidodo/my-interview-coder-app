import {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  screen,
  session,
} from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { IPC_CHANNELS } from './constants';
import { registerSummaryIpc } from './summary/registerSummaryIpc';
import { registerTranscriptionIpc } from './transcription/registerTranscriptionIpc';

const ENV_FILE_NAME = '.env';

const loadEnvFile = () => {
  const envFilePath = path.join(app.getAppPath(), ENV_FILE_NAME);
  if (fs.existsSync(envFilePath)) process.loadEnvFile(envFilePath);
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

ipcMain.handle(IPC_CHANNELS.CAPTURE_SCREENS, async () => {
  const displays = screen.getAllDisplays();
  if (!displays.length) throw new Error('No displays found');
  const thumbnailSize = {
    width: Math.max(...displays.map((d) => d.size.width * d.scaleFactor)),
    height: Math.max(...displays.map((d) => d.size.height * d.scaleFactor)),
  };
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize,
  });
  const screenshots = sources
    .filter((source) => !source.thumbnail.isEmpty())
    .map((source) => source.thumbnail.toDataURL());
  if (!screenshots.length) throw new Error('No screen captured');
  return screenshots;
});

const registerDisplayMediaHandler = () => {
  session.defaultSession.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      const sources = await desktopCapturer.getSources({ types: ['screen'] });
      callback({ video: sources[0], audio: 'loopback' });
    },
  );
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  loadEnvFile();
  registerDisplayMediaHandler();
  registerSummaryIpc();
  registerTranscriptionIpc();
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
