const { ipcRenderer } = require("electron");

const activationBtn = document.getElementById("actvat");

const sendActivationCode = (code) => {
  try {
    const data = {
      code,
    };
    const url = "https://activespyprint.gooadmin.com/api/v1/activate/code";
    const config = {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    };
    fetch(url, config)
      .then((res) => {
        return res.json();
      })
      .then((result) => {
        if (result.success) {
          ipcRenderer.send("activation_success", {
            code,
            expiryDate: result.expiryDate,
          });
          alert("Activation success");
        } else {
          alert("Activation faild!");
        }
      })
      .catch((err) => {
        alert(err);
      });
  } catch (err) {
    alert(err);
  }
};

activationBtn.addEventListener("click", () => {
  const acitvationCode = document.getElementById("actvcd").value;
  sendActivationCode(acitvationCode);
});
