const crypto = require("crypto");
process.env.SECRET_KEY =
  "110ad1f54cbcbf2b18d4e763b2ebb2b235b55baf12bc9b25172bcccb83959e56";

exports.encryption = (text) => {
  const algorithm = "aes-256-cbc";
  const secretKey = Buffer.from(process.env.SECRET_KEY, "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

exports.decryption = (text) => {
  const algorithm = "aes-256-cbc";
  const secretKey = Buffer.from(process.env.SECRET_KEY, "hex");
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedData = parts.join(":");
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

exports.getLocalDate = (date) => {
  const dateBegin = new Date(date).setHours(0, 0, 0, 0);
  const newDate = new Date(dateBegin);
  const localDate = new Date(
    newDate.getTime() - newDate.getTimezoneOffset() * 60000
  );
  return localDate;
};
