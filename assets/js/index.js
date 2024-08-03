const { ipcRenderer } = require("electron");
const utilities = require("../../utils/utilities");

const videoElement = document.getElementById("vdoplyr");

let host;
let username;

ipcRenderer.send("get_isActive");

ipcRenderer.on("is_active", (e, data) => {
  host = data.host;
  username = utilities.decryption(data.username);
});

setTimeout(() => {
  const socket = io(process.env.HOST, { transports: ["websocket", "polling"] });
  socket.on("connect", () => {
    alert("Socket connected to server");
  });
  socket.emit("send_video");
  socket.on(`${username}`, (ev) => {
    let encUrl = ev.url;
    ipcRenderer.send("decrypt_data", { encUrl });
  });
}, 2000);

ipcRenderer.on("data_decrypted", (e, data) => {
  videoElement.src = data.decrypted;
});
