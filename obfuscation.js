const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const sourceDir = path.join(__dirname, "assets"); // Replace with your source directory
const outputDir = path.join(__dirname, "obfuscated", "assets"); // Replace with your output directory

function obfuscateFile(filePath, outputFilePath) {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const obfuscatedContent = JavaScriptObfuscator.obfuscate(fileContent, {
    compact: true,
    controlFlowFlattening: true,
    deadCodeInjection: true,
    debugProtection: false,
    disableConsoleOutput: true,
    identifierNamesGenerator: "hexadecimal",
    rotateStringArray: true,
    stringArray: true,
    stringArrayThreshold: 0.75,
  }).getObfuscatedCode();

  fs.writeFileSync(outputFilePath, obfuscatedContent, "utf8");
}

function obfuscateDirectory(directory, outputDirectory) {
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  const files = fs.readdirSync(directory);

  files.forEach((file) => {
    const fullPath = path.join(directory, file);
    const outputFilePath = path.join(outputDirectory, file);

    if (fs.statSync(fullPath).isDirectory()) {
      obfuscateDirectory(fullPath, outputFilePath);
    } else if (fullPath.endsWith(".js")) {
      obfuscateFile(fullPath, outputFilePath);
    } else {
      fs.copyFileSync(fullPath, outputFilePath); // Copy non-JS files as is
    }
  });
}

obfuscateDirectory(sourceDir, outputDir);
