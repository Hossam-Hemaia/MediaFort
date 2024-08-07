const { ipcRenderer } = require("electron");
const utilities = require("../../utils/utilities");

const videoElement = document.getElementById("vdoplyr");

let host;
let username;

ipcRenderer.send("get_isActive");

ipcRenderer.on("is_active", (e, data) => {
  host = process.env.HOST;
  username = utilities.decryption(data.username);
});

setTimeout(() => {
  const socket = io(host, { transports: ["websocket", "polling"] });
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

ipcRenderer.on("error", (e, data) => {
  alert(data.message);
  videoElement.src = "";
});
