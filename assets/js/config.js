const { ipcRenderer } = require("electron");
const utilities = require("../../utils/utilities");

const getConfigurations = () => {
  ipcRenderer.send("get_configs");
};

getConfigurations();

ipcRenderer.on("config_data", (e, data) => {
  const usernameInput = document.querySelector("[name=username]");
  let username = utilities.decryption(data.username);
  usernameInput.value = username;
});

const setConfiguration = () => {
  const username = document.querySelector("[name=username]").value;
  const configs = [
    {
      username: utilities.encryption(username),
    },
  ];
  ipcRenderer.send("set_configs", { configData: configs });
  alert("configuration saved, quitting application");
  ipcRenderer.send("restart_app");
  window.close();
};

const configBtn = document.getElementById("savCnfg");
if (configBtn) {
  configBtn.addEventListener("click", () => {
    setConfiguration();
  });
}
