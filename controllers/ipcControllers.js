const { ipcMain } = require("electron");
const dbController = require("../controllers/dbControllers");

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
