const { app, BrowserWindow, Menu, Tray } = require("electron");

const dbController = require("./controllers/dbControllers");
const ipcController = require("./controllers/ipcControllers");

process.env.NODE_ENV = "dev";
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

ipcController.setConfigs();
ipcController.isActiveApp();
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
}

app.on("ready", () => {
  createMainWindow();
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("close", (e) => {
    app.quit();
  });
});

// activation
// icon and tray
