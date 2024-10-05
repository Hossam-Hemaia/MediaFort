const { ipcMain, app } = require("electron");
const os = require("os");
const { exec } = require("child_process");

const dbController = require("./dbControllers");
const utilities = require("../utils/utilities");
const { stdout, stderr } = require("process");

exports.isRunningInVM = () => {
  const vmMacAddresses = [
    "00:05:69", // VMware
    "00:0C:29", // VMware
    "00:1C:14", // VMware
    "00:50:56", // VMware
    "08:00:27", // VirtualBox
    "0A:00:27", // VirtualBox
    "52:54:00", // QEMU, KVM
    "00:03:FF", // Microsoft Hyper-V
  ];

  const networkInterfaces = os.networkInterfaces();
  for (const iface of Object.values(networkInterfaces)) {
    for (const config of iface) {
      if (vmMacAddresses.some((vmMac) => config.mac.startsWith(vmMac))) {
        return true;
      }
    }
  }
  return false;
};

exports.checkForVMProcesses = (callback) => {
  const commands = ["wmic bios get serialnumber", "wmic csproduct get name"];

  exec(commands.join(" & "), (error, stdout, stderr) => {
    if (error) {
      callback(false);
      return;
    }

    const output = stdout.toLowerCase();
    const vmIndicators = [
      "virtualbox",
      "vmware",
      "qemu",
      "hyper-v",
      "parallels",
      "xen",
      "kvm",
    ];

    callback(vmIndicators.some((indicator) => output.includes(indicator)));
  });
};

exports.checkForSharingProcesses = (callback) => {
  try {
    const screenSharingProcesses = [
      "spacedeskService.exe",
      "Miracast.exe",
      "AirPlay.exe",
      "Sidecar.exe",
    ];
    exec("tasklist", (err, stdout, stderr) => {
      if (err) {
        console.error("Error running tasklist command", err);
        callback(false);
        return;
      }
      const isScreenSharingRunning = screenSharingProcesses.some((process) =>
        stdout.includes(process)
      );
      if (isScreenSharingRunning) {
        console.log(
          "Screen sharing software detected, preventing application from opening."
        );
        // Here you can exit the application or show a warning to the user
        callback(true);
      }
    });
  } catch (err) {
    throw err;
  }
};

exports.activateApp = () => {
  ipcMain.on("activation_success", (e, data) => {
    let activationData = [
      {
        code: utilities.encryption(data.activationCode),
        isActive: 1,
        expiryDate: utilities.encryption(data.expiryDate),
      },
    ];
    dbController.setActivationData(activationData);
  });
};

exports.checkActivation = (activationData) => {
  try {
    if (activationData.length > 0) {
      const dateNow = Date.now();
      const date = new Date(dateNow);
      const expiryDate = new Date(activationData[0].expiryDate);
      const endDate = new Date(expiryDate);
      if (activationData[0].isActive === 1 && date < endDate) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } catch (err) {
    throw err;
  }
};

exports.setConfigs = () => {
  ipcMain.on("set_configs", async (e, data) => {
    const configData = data.configData;
    dbController.setDataToConfigTable(configData);
  });
};

exports.getConfigs = () => {
  ipcMain.on("get_configs", async (e) => {
    const configData = await dbController.getConfigData();
    let username;
    configData.forEach((row) => {
      username = row.username;
    });
    e.sender.send("config_data", { username });
  });
};

exports.isActiveApp = () => {
  ipcMain.on("get_isActive", async (e) => {
    const activationData = await dbController.getActivationData();
    const activeData = [
      {
        code: utilities.decryption(activationData[0].code),
        isActive: activationData[0].isActive,
        expiryDate: utilities.decryption(activationData[0].expiryDate),
      },
    ];
    const isActiveApp = this.checkActivation(activeData);
    if (isActiveApp) {
      const configData = await dbController.getConfigData();
      let host;
      let username;
      configData.forEach((row) => {
        host = row.host;
        username = row.username;
      });
      e.sender.send("is_active", {
        host,
        username,
        expiryDate: activeData[0].expiryDate,
      });
    } else {
      e.sender.send("error", { message: "Application is not activated!" });
    }
  });
};

exports.encryptData = () => {
  try {
    ipcMain.on("encrypt_data", (e, data) => {
      const encrypted = utilities.encryption(data.text);
      e.sender.send("data_encrypted", { encrypted });
    });
  } catch (err) {
    throw err;
  }
};

exports.decryptdata = () => {
  ipcMain.on("decrypt_data", (e, data) => {
    let decrypted = utilities.decryption(data.encUrl);
    e.sender.send("data_decrypted", { decrypted, sourceType: data.sourceType });
  });
};

exports.restartApp = () => {
  ipcMain.on("restart_app", (e) => {
    app.quit();
  });
};
