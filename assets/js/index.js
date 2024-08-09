const { ipcRenderer } = require("electron");
const utilities = require("../../utils/utilities");

const videoElement = document.getElementById("vdoplyr");
const usernameOutput = document.getElementById("usrshw");
const expiryDateOutput = document.getElementById("xpryshw");

let host;
let username;
let expiryDate;

ipcRenderer.send("get_isActive");

ipcRenderer.on("is_active", (e, data) => {
  host = process.env.HOST;
  username = utilities.decryption(data.username);
  expiryDate = data.expiryDate;
  usernameOutput.innerText = username;
  expiryDateOutput.innerText = new Date(expiryDate).toLocaleDateString();
});

setTimeout(() => {
  const socket = io(host, { transports: ["websocket", "polling"] });
  socket.on("connect", () => {
    socket.emit("update_socket", { username: username });
    alert("Socket connected to server");
  });
  socket.on(`${username}`, (ev) => {
    let encUrl = ev.url;
    ipcRenderer.send("wake_up");
    ipcRenderer.send("decrypt_data", { encUrl });
  });
}, 2000);

ipcRenderer.on("data_decrypted", (e, data) => {
  videoElement.src = data.decrypted;
});

ipcRenderer.on("error", (e, data) => {
  alert(data.message);
  videoElement.src = "";
});
