const { ipcMain, app } = require("electron");
const dbController = require("../controllers/dbControllers");
const os = require("os");
const { exec } = require("child_process");

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

exports.setConfigs = () => {
  ipcMain.on("set_configs", async (e, data) => {
    const configData = data.configData;
    dbController.setDataToConfigTable(configData);
  });
};

exports.getConfigs = () => {
  ipcMain.on("get_configs", async (e) => {
    const configData = await dbController.getConfigData();
    let host;
    let username;
    configData.forEach((row) => {
      host = row.host;
      username = row.username;
    });
    e.sender.send("config_data", { host, username });
  });
};

exports.isActiveApp = () => {
  ipcMain.on("get_isActive", async (e) => {
    const configData = await dbController.getConfigData();
    let host;
    let username;
    configData.forEach((row) => {
      host = row.host;
      username = row.username;
    });
    e.sender.send("is_active", { host, username });
  });
};

exports.restartApp = () => {
  ipcMain.on("restart_app", (e) => {
    app.quit();
  });
};
