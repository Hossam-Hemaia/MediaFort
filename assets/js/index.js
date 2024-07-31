const { ipcRenderer } = require("electron");

const videoElement = document.getElementById("vdoplyr");

let host;
let username;

ipcRenderer.send("get_isActive");

ipcRenderer.on("is_active", (e, data) => {
  host = data.host;
  username = data.username;
});

setTimeout(() => {
  const socket = io(host, { transports: ["websocket", "polling"] });
  socket.on("connect", () => {
    alert("Socket connected to server");
  });
  socket.emit("send_video");
  socket.on(`${username}`, (ev) => {
    let vidUrl = ev.url;
    videoElement.src = vidUrl;
  });
}, 2000);
