const { ipcRenderer } = require("electron");
const ytdl = require("@distube/ytdl-core");
const utilities = require("../../utils/utilities");

const videoElement = document.getElementById("vdoplyr");
const videoSource = document.getElementById("vidSrc");
const iframeElement = document.getElementById("ifrmplyr");
const usernameOutput = document.getElementById("usrshw");
const expiryDateOutput = document.getElementById("xpryshw");
const statusIndicator = document.getElementById("statusIndicator");
const statusText = document.getElementById("statusText");

statusIndicator.style.backgroundColor = "red";
statusText.textContent = "Disconnected";
iframeElement.style.display = "none";

let host;
let username;
let expiryDate;

async function youtubeStreamer(youtubeUrl, video) {
  try {
    const info = await ytdl.getInfo(youtubeUrl);
    const videoFormat = ytdl.chooseFormat(info.formats, {
      quality: "highestvideo",
      filter: (format) =>
        format.container === "mp4" && format.hasVideo && format.hasAudio,
    });
    video.src = videoFormat.url;
  } catch (err) {
    console.error("Error in youtubeStreamer:", err);
  }
}

ipcRenderer.send("get_isActive");

ipcRenderer.on("is_active", (e, data) => {
  host = process.env.HOST;
  username = utilities.decryption(data.username);
  expiryDate = data.expiryDate;
  usernameOutput.innerText = username;
  watermark.innerText = username;
  expiryDateOutput.innerText = new Date(expiryDate).toLocaleDateString();
});

setTimeout(() => {
  const socket = io(host, { transports: ["websocket", "polling"] });
  socket.on("connect", () => {
    socket.emit("update_socket", { username: username });
    statusIndicator.style.backgroundColor = "green";
    statusText.textContent = "Connected";
    alert("Socket connected to server");
  });
  socket.on(`${username}`, (ev, ack) => {
    let encUrl = ev.url;
    let sourceType = ev.sourceType;
    ipcRenderer.send("wake_up");
    ipcRenderer.send("decrypt_data", { encUrl, sourceType });
    ack({ status: "ok" });
  });
  socket.on("disconnect", () => {
    statusIndicator.style.backgroundColor = "red";
    statusText.textContent = "Disconnected";
  });
}, 2000);

ipcRenderer.on("data_decrypted", async (e, data) => {
  if (data.sourceType === "iframe") {
    videoElement.style.display = "none";
    iframeElement.style.display = "block";
    iframeElement.src = data.decrypted;
  } else if (data.sourceType === "youtube") {
    videoElement.style.display = "block";
    iframeElement.style.display = "none";
    await youtubeStreamer(data.decrypted, videoElement);
  } else {
    videoElement.style.display = "block";
    iframeElement.style.display = "none";
    videoElement.src = data.decrypted;
  }
});

ipcRenderer.on("error", (e, data) => {
  alert(data.message);
  videoElement.src = "";
});

const watermark = document.getElementById("watermark");
watermark.innerText = username;
function moveWatermark() {
  const videoRect = videoElement.getBoundingClientRect(); // Get video element size and position
  const watermarkWidth = watermark.offsetWidth;
  const watermarkHeight = watermark.offsetHeight;

  // Calculate available space within video for watermark movement
  const maxX = videoRect.width - watermarkWidth; // Maximum X position
  const maxY = videoRect.height - watermarkHeight; // Maximum Y position

  // Generate random positions within the video element
  const randomX = Math.random() * maxX;
  const randomY = Math.random() * maxY;

  // Update watermark position relative to video element
  watermark.style.left = `${videoRect.left + randomX}px`;
  watermark.style.top = `${videoRect.top + randomY}px`;
}
setInterval(moveWatermark, 10000); // Move every 10 seconds
document.addEventListener("fullscreenchange", (event) => {
  if (document.fullscreenElement) {
    watermark.classList.add("fullscreen");
  } else {
    watermark.classList.remove("fullscreen");
  }
});
