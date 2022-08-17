
const {app, BrowserWindow, nativeImage} = require('electron');
const path = require('path');

// HACK for windows to not install stuff multiple times
// see: https://www.electronforge.io/config/makers/squirrel.windows
// if (require('electron-squirrel-startup')) return app.quit();

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      //preload: path.join(__dirname, 'preload.js')
      nodeIntegration: true,
    },
    icon: path.join(__dirname, 'favicon.png')
  });


  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  mainWindow.setFullScreen(true);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}
const image = nativeImage.createFromPath(
  app.getAppPath() + "/favicon.ico"
);
app.dock.setIcon(image);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  app.quit()
});

