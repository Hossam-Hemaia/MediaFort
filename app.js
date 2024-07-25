const { app, BrowserWindow, Menu, ipcMain, Tray } = require("electron");

process.env.NODE_ENV = "dev";
const isDev = process.env.NODE_ENV !== "production" ? true : false;

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Media Fort",
    width: 1080,
    height: 684,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadFile("./assets/html/index.html");
  mainWindow.setContentProtection(true);
}

app.on("ready", () => {
  createMainWindow();
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("close", (e) => {
    e.preventDefault();
    app.quit();
  });
});
