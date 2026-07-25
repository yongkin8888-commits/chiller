const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs/promises');

let win;

function createWindow() {
  const display = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({
    width: 900,
    height: 800,
    x: Math.max(display.x, display.x + display.width - 930),
    y: Math.max(display.y, display.y + display.height - 840),
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
  win.setAlwaysOnTop(true, 'floating');
}

ipcMain.on('move-window', (_event, { dx, dy }) => {
  if (!win || win.isDestroyed()) return;
  const [x, y] = win.getPosition();
  win.setPosition(x + Math.round(dx), y + Math.round(dy));
});

ipcMain.on('close-app', () => app.quit());

ipcMain.handle('layout-load', async () => {
  const layoutPath = path.join(app.getPath('userData'), 'fridge-layout.json');
  try {
    return JSON.parse(await fs.readFile(layoutPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Could not load fridge layout:', error);
    return { items: {}, magnets: {} };
  }
});

ipcMain.handle('layout-save', async (_event, layout) => {
  const layoutPath = path.join(app.getPath('userData'), 'fridge-layout.json');
  const safeLayout = {
    items: layout && typeof layout.items === 'object' ? layout.items : {},
    magnets: layout && typeof layout.magnets === 'object' ? layout.magnets : {},
    settings: layout && typeof layout.settings === 'object' ? layout.settings : {}
  };
  await fs.mkdir(path.dirname(layoutPath), { recursive: true });
  await fs.writeFile(layoutPath, JSON.stringify(safeLayout, null, 2), 'utf8');
  return true;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
