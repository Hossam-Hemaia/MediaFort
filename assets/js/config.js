const { ipcRenderer } = require("electron");

const getConfigurations = () => {
  ipcRenderer.send("get_configs");
};

getConfigurations();

ipcRenderer.on("config_data", (e, data) => {
  const hostInput = document.querySelector("[name=host]");
  const usernameInput = document.querySelector("[name=username]");
  let host = data.host;
  let username = data.username;
  hostInput.value = host;
  usernameInput.value = username;
});

const setConfiguration = () => {
  const host = document.querySelector("[name=host]").value;
  const username = document.querySelector("[name=username]").value;
  const configs = [
    {
      host,
      username,
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
