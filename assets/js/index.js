const { ipcRenderer } = require("electron");
const ytdl = require("@distube/ytdl-core");
const utilities = require("../../utils/utilities");

const videoElement = document.getElementById("vdoplyr");
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
    // Choose the best available format with both video and audio
    const format = ytdl.chooseFormat(info.formats, {
      quality: "highest",
      filter: (format) =>
        format.container === "mp4" && format.hasAudio && format.hasVideo,
    });
    video.src = format.url;
    // // Ensure the format contains both video and audio
    // if (!format || !format.mimeType || !format.codecs) {
    //   throw new Error(
    //     "Could not find a suitable format with both audio and video."
    //   );
    // }

    // const stream = ytdl(youtubeUrl, { format });

    // const mediaSource = new MediaSource();
    // video.src = URL.createObjectURL(mediaSource);

    // mediaSource.addEventListener("sourceopen", () => {
    //   // Properly format the mimeCodec string
    //   const mimeCodec = `${format.mimeType}; codecs="${format.codecs}"`;
    //   console.log("Using mimeCodec:", mimeCodec);

    //   try {
    //     const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
    //     const queue = [];
    //     let appending = false;

    //     function appendToSourceBuffer() {
    //       if (
    //         appending ||
    //         queue.length === 0 ||
    //         mediaSource.readyState !== "open"
    //       ) {
    //         return;
    //       }

    //       appending = true;
    //       const chunk = queue.shift();

    //       if (sourceBuffer.updating) {
    //         queue.unshift(chunk); // Put the chunk back if the buffer is still updating
    //       } else {
    //         try {
    //           sourceBuffer.appendBuffer(new Uint8Array(chunk));
    //         } catch (error) {
    //           console.error("Error appending buffer:", error);
    //         }
    //       }
    //     }

    //     // Listen to the updateend event to append the next chunk
    //     sourceBuffer.addEventListener("updateend", () => {
    //       appending = false;
    //       appendToSourceBuffer(); // Append next chunk if any
    //     });

    //     // Handle SourceBuffer errors
    //     sourceBuffer.addEventListener("error", (err) => {
    //       console.error("SourceBuffer error:", err);
    //       // Close the media source if there's an error
    //       if (mediaSource.readyState === "open") {
    //         try {
    //           mediaSource.endOfStream("decode");
    //         } catch (e) {
    //           console.error("Error during endOfStream:", e);
    //         }
    //       }
    //     });

    //     // Collect chunks and append them to the queue
    //     stream.on("data", (chunk) => {
    //       console.log("Received data chunk");
    //       queue.push(chunk);
    //       appendToSourceBuffer();
    //     });

    //     // Handle stream end
    //     stream.on("end", () => {
    //       console.log("Stream ended");
    //       if (mediaSource.readyState === "open" && !sourceBuffer.updating) {
    //         try {
    //           mediaSource.endOfStream();
    //           video.play();
    //         } catch (err) {
    //           console.error("Error ending media stream:", err);
    //         }
    //       }
    //     });

    //     // Handle stream errors
    //     stream.on("error", (err) => {
    //       console.error("Stream error:", err);
    //       if (mediaSource.readyState === "open") {
    //         mediaSource.endOfStream("decode");
    //       }
    //     });
    //   } catch (err) {
    //     console.error("Error adding SourceBuffer:", err);
    //   }
    // });

    // // Handle MediaSource errors
    // mediaSource.addEventListener("error", (err) => {
    //   console.error("MediaSource error:", err);
    // });
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
