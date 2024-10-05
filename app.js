const path = require("path");
const { app, BrowserWindow, Menu, Tray, ipcMain, dialog } = require("electron");
const os = require("os");

function checkOS() {
  const platform = os.platform();

  if (platform !== "win32") {
    dialog.showErrorBox(
      "Unsupported Operating System",
      "This application can only run on Windows."
    );
    app.quit();
  }
}
// checkOS();

const dbController = require("./controllers/dbControllers");
const ipcController = require("./controllers/ipcControllers");
const utilities = require("./utils/utilities");

process.env.NODE_ENV = "production";
process.env.HOST = "wss://mediafort.kportals.net";
const isDev = process.env.NODE_ENV !== "production" ? true : false;

dbController.dbInit(app);
dbController.createActivationTable();
dbController.createConfigTable();

let mainWindow;
let configWindow;
let activationWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Media Fort",
    width: 1080,
    height: 684,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "assets", "icons", "fort.png"),
  });
  mainWindow.loadFile("./assets/html/index.html");
  mainWindow.setContentProtection(true);
}

function createConfigWindow() {
  configWindow = new BrowserWindow({
    title: "Configuration",
    width: 516,
    height: 350,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "assets", "icons", "fort.png"),
  });
  configWindow.loadFile("./assets/html/config.html");
  ipcController.getConfigs();
}

function createActivationWindow() {
  activationWindow = new BrowserWindow({
    title: "Configuration",
    width: 516,
    height: 350,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "assets", "icons", "fort.png"),
  });
  activationWindow.loadFile("./assets/html/activation.html");
}

const menu = [
  { role: "appMenu" },
  {
    label: "Settings",
    submenu: [
      {
        label: "Activation",
        click: () => {
          createActivationWindow();
          if (isDev) {
            activationWindow.webContents.openDevTools();
          }
        },
      },
      {
        label: "Configuration",
        click: () => {
          createConfigWindow();
          if (isDev) {
            configWindow.webContents.openDevTools();
          }
        },
      },
    ],
  },
  ...(isDev
    ? [
        {
          label: "Developers",
          submenu: [{ role: "reload" }, { role: "forcereload" }],
        },
      ]
    : []),
];

async function getApplicationIsActive() {
  const activationData = await dbController.getActivationData();
  const activeData = [
    {
      code: utilities.decryption(activationData[0].code),
      isActive: activationData[0].isActive,
      expiryDate: utilities.decryption(activationData[0].expiryDate),
    },
  ];
  const isActivated = ipcController.checkActivation(activeData);
  if (isActivated) {
    return true;
  } else {
    return false;
  }
}

ipcController.encryptData();
ipcController.activateApp();
if (getApplicationIsActive()) {
  ipcController.setConfigs();
  ipcController.isActiveApp();
  ipcMain.on("wake_up", (e) => {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  });
  ipcController.decryptdata(mainWindow);
}
ipcController.restartApp();

if (ipcController.isRunningInVM()) {
  app.quit();
} else {
  ipcController.checkForVMProcesses((isVm) => {
    if (isVm) {
      console.log("Detected VM environment. Exiting application.");
      app.quit();
    }
  });
  ipcController.checkForSharingProcesses((isSharing) => {
    if (isSharing) {
      console.log("Screen sharing software detected.");
      app.quit();
    }
  });
}

setInterval(() => {
  ipcController.checkForSharingProcesses((isSharing) => {
    if (isSharing) {
      console.log("Screen sharing software detected.");
      app.quit();
    }
  });
}, 300000);

const getTheLock = app.requestSingleInstanceLock();
if (!getTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, argv, workingDirectory) => {
    // If the user tries to start a second instance, focus the main window if it's open
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.on("ready", () => {
    createMainWindow();
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
    const icon = path.join(__dirname, "assets", "icons", "fort.png");
    let tray = new Tray(icon);
    tray.on("click", () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    });
    tray.on("right-click", () => {
      const contextMenu = Menu.buildFromTemplate([
        {
          label: "Quit",
          click: () => {
            app.isQuitting = true;
            app.quit();
          },
        },
      ]);
      tray.popUpContextMenu(contextMenu);
    });
    mainWindow.on("close", (e) => {
      app.quit();
    });
  });
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
// activation
// icon and tray
