const { app, BrowserWindow, ipcMain, desktopCapturer, dialog, shell, session, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let selectedSourceId = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#0b1118',
    title: 'Capture',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 320, height: 180 },
        fetchWindowIcons: true
      });
      const source = sources.find((item) => item.id === selectedSourceId) || sources[0];
      callback(source ? { video: source, audio: 'loopback' } : {});
    } catch (error) {
      console.error('Display media handler failed:', error);
      callback({});
    }
  });

  ipcMain.handle('capture:get-sources', async () => {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 480, height: 270 },
      fetchWindowIcons: true
    });
    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      type: source.id.startsWith('screen:') ? 'screen' : 'window',
      thumbnail: source.thumbnail.toDataURL(),
      appIcon: source.appIcon ? source.appIcon.toDataURL() : null
    }));
  });

  ipcMain.handle('capture:set-source', (_event, sourceId) => {
    selectedSourceId = sourceId;
    return { ok: true };
  });

  ipcMain.handle('capture:save-project', async (_event, project) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'حفظ مشروع Capture',
      defaultPath: `${project.name || 'capture-project'}.capture.json`,
      filters: [{ name: 'Capture Project', extensions: ['capture.json'] }, { name: 'JSON', extensions: ['json'] }]
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    fs.writeFileSync(result.filePath, JSON.stringify(project, null, 2), 'utf8');
    return { canceled: false, filePath: result.filePath };
  });

  ipcMain.handle('capture:open-project', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'فتح مشروع Capture',
      properties: ['openFile'],
      filters: [{ name: 'Capture Project', extensions: ['json'] }]
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const raw = fs.readFileSync(result.filePaths[0], 'utf8');
    return { canceled: false, filePath: result.filePaths[0], project: JSON.parse(raw) };
  });

  ipcMain.handle('capture:export-video', async (_event, payload) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'تصدير الفيديو',
      defaultPath: `${payload.name || 'capture-recording'}.${payload.extension || 'webm'}`,
      filters: [{ name: 'WebM Video', extensions: ['webm'] }, { name: 'MP4 Video', extensions: ['mp4'] }]
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    const base64 = String(payload.dataUrl || '').replace(/^data:[^;]+;base64,/, '');
    fs.writeFileSync(result.filePath, Buffer.from(base64, 'base64'));
    return { canceled: false, filePath: result.filePath };
  });

  ipcMain.handle('capture:open-path', (_event, filePath) => {
    if (filePath) shell.openPath(filePath);
    return { ok: true };
  });

  createWindow();
  globalShortcut.register('CommandOrControl+Shift+R', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('capture:toggle-recording');
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
