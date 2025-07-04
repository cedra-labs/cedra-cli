import { execSync } from "child_process";
import { existsSync } from "fs";
import { arch } from "os";
import { GH_CLI_DOWNLOAD_URL, PNAME } from "../utils/consts.js";
import { execSyncShell } from "../utils/execSyncShell.js";
import { getCurrentOpenSSLVersion } from "../utils/versions.js";
import { getOS } from "../utils/getUserOs.js";
import { getLocalBinPath } from "../utils/getLocalBinPath.js";
import { getLatestVersionGh } from "../utils/ghOperations.js";

// Install the CLI.
export const installCli = async () => {
  const path = getLocalBinPath();
  if (existsSync(path)) {
    console.log("cedra CLI is already installed");
    return;
  }
  // Look up the latest version.
  const latestCLIVersion = await getLatestVersionGh();
  console.log(`Downloading cedra CLI version ${latestCLIVersion}`);
  const os = getOS();

  if (os === "Windows") {
    const url = `${GH_CLI_DOWNLOAD_URL}/${PNAME}-v${latestCLIVersion}/${PNAME}-${latestCLIVersion}-${os}-x86_64.zip`;
    // Download the zip file, extract it, and move the binary to the correct location.
    execSync(
      `powershell -Command "if (!(Test-Path -Path 'C:\\tmp')) { New-Item -ItemType Directory -Path 'C:\\tmp' } ; Invoke-RestMethod -Uri ${url} -OutFile C:\\tmp\\cedra.zip; Expand-Archive -Path C:\\tmp\\cedra.zip -DestinationPath C:\\tmp -Force; Move-Item -Path C:\\tmp\\cedra.exe -Destination \"${path}\""`,
    );
  } else if (os === "MacOS") {
    // Install the CLI with brew.
    execSyncShell("brew install cedra", { encoding: "utf8" });
  } else if (os === "Linux") {
    let osArch = "x86_64";
    if (arch() == "x64") {
      osArch = "x86_64";
    } else {
      osArch = "arm64";
    }

    console.log(`Downloading CLI binary ${os}-${osArch}`);
    const url = `${GH_CLI_DOWNLOAD_URL}/${PNAME}-v${latestCLIVersion}/${PNAME}-${latestCLIVersion}-${os}-${osArch}.zip`;
    // Download the zip file, extract it, and move the binary to the correct location.
    execSync(
      `curl -L -o /tmp/cedra.zip ${url}; unzip -o -q /tmp/cedra.zip -d /tmp; mv /tmp/cedra ${path};`,
    );
  } else {
    // On Linux, we check what version of OpenSSL we're working with to figure out
    // which binary to download.
    let osVersion = "x86_64";
    let opensSslVersion = "1.0.0";
    try {
      opensSslVersion = getCurrentOpenSSLVersion();
    } catch (error) {
      console.log(
        "Could not determine OpenSSL version, assuming older version (1.x.x)",
      );
    }

    if (opensSslVersion.startsWith("3.")) {
      osVersion = "22.04-x86_64";
    }
    console.log(`Downloading CLI binary ${os}-${osVersion}`);
    const url = `${GH_CLI_DOWNLOAD_URL}/${PNAME}-v${latestCLIVersion}/${PNAME}-${latestCLIVersion}-${os}-${osVersion}.zip`;
    // Download the zip file, extract it, and move the binary to the correct location.
    execSync(
      `curl -L -o /tmp/cedra.zip ${url}; unzip -o -q /tmp/cedra.zip -d /tmp; mv /tmp/cedra ${path};`,
    );
  }
};
