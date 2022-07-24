import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { tmpdir } from "os";
import { randomBytes } from "crypto";
const __dirname = path.resolve();
const tmpDirHash = randomBytes(5).toString("hex");
const tmpDirectory = path.join(tmpdir(), `hls${tmpDirHash}/`);
const DOWNLOAD_RETRIES = 5;
const DOWNLOAD_CHUNK_SIZE = 20;
const downloadWithRetries = async (url, filepath) => {
  return new Promise(async (res, rej) => {
    let currentTries = 0;
    while (currentTries <= DOWNLOAD_RETRIES) {
      try {
        await download(url, filepath);
        break;
      } catch (error) {
        currentTries++;
      }
    }
    if (currentTries <= DOWNLOAD_RETRIES) {
      res();
    }
    rej();
  });
};

const download = async (url, filePath) => {
  return await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    const request = (url.startsWith("https") ? https : http)
      .get(url)
      .on("response", (res) => {
        res.pipe(file);
        file.on("finish", () => {
          resolve(filePath);
        });
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {
          reject(err);
        });
      });
    request.setTimeout(10000, () => {
      request.socket.destroy();
      request.destroy();
      fs.unlink(filePath, () => {
        reject("socket timeout");
      });
    });
  });
};

const readFile = async (filePath) => {
  return await fs.promises.readFile(filePath, { encoding: "utf8" });
};

const writeFile = async (data, filePath) => {
  await fs.promises.writeFile(filePath, data);
  return filePath;
};

// returns first playlist file
const scanMasterPlaylist = (data) => {
  const lines = data.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/\.m3u8$/)) {
      return line;
    }
  }
};
/**
 * Extracts hostname url and filename from an url
 * @param url to extract information
 * @returns {{filename: string, hostUrl: string}} hostname can be an empty string if only url is a filename
 */
const extractHostnameFilenameFromUrl = (url) => {
  const splitUrl = url.split("/");
  const hostUrl = splitUrl.slice(0, splitUrl.length - 1).join("/");
  const filename = splitUrl.pop();
  return { hostUrl, filename };
};

/**
 * Cuts array in Chunks
 * @param arr to be cutted
 * @param chunkSize how many elements per Chunk
 * @returns {*[]}
 */
function spliceIntoChunks(arr, chunkSize) {
  const res = [];
  while (arr.length > 0) {
    const chunk = arr.splice(0, chunkSize);
    res.push(chunk);
  }
  return res;
}

/**
 * downloads all segments (.ts files) and returns new m3u8
 * @param data Playlist data from Host
 * @param playlistHostUrl URL which was given to download the playlist
 * @returns {Promise<string>} Playlist file with local segment paths
 */
const scanPlaylist = async (data, playlistHostUrl) => {
  const newPlaylistDataLines = [];
  const segmentFiles = [];
  let completedFiles = 0;
  const lines = data.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/\.ts$/)) {
      // we need the segment
      const lineData = extractHostnameFilenameFromUrl(line);
      const segmentFilename = lineData.filename;
      const segmentUrl =
        lineData.hostUrl !== ""
          ? `${lineData.hostUrl}/${segmentFilename}`
          : `${playlistHostUrl}/${segmentFilename}`;
      // check if file exists
      const segmentFilepath = path.join(tmpDirectory, segmentFilename);
      // Queue downloads and show progress of download
      segmentFiles.push(
        new Promise(async (resolve) => {
          await downloadWithRetries(segmentUrl, segmentFilepath);
          completedFiles++;
          const percentage = (
            (completedFiles / segmentFiles.length) *
            100
          ).toFixed(2);
          console.clear();
          console.log(`Downloading Segments, progress: ${percentage}%`);

          resolve();
        })
      );
      newPlaylistDataLines.push(segmentFilepath);
    } else {
      newPlaylistDataLines.push(line);
    }
  }
  // Prepare small Chunks for downloading
  const downloadWorkLoad = spliceIntoChunks(
    segmentFiles.slice(),
    DOWNLOAD_CHUNK_SIZE
  );
  // Run multiple downloads per chunk size
  for (let i = 0; i < downloadWorkLoad.length; i++) {
    await Promise.all([...downloadWorkLoad[i]]);
  }
  return newPlaylistDataLines.join("\n");
};

async function mergeSegments(command, output) {
  await new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(stderr);
      resolve();
    });
  });
}

function validateInputFile(json) {
  // check if streams property exists
  const streams = json.streams;
  let isValide = !!streams;

  // check properties of stream is valide
  if (isValide) {
    for (let i in streams) {
      const stream = streams[i];
      if (!isValide) break;
      isValide = !!stream.url && !!stream.output;
    }
  }

  return isValide;
}

function getInputFile(inputFilePath) {
  if (!fs.existsSync(inputFilePath)) {
    throw new Error(`Input file not found at ${inputFilePath}`);
  }
  const json = JSON.parse(fs.readFileSync(inputFilePath));
  if (!validateInputFile(json)) {
    throw new Error(
      `Input file doesn't contain all needed values or is invalide`
    );
  }
  return json;
}

async function createWorkFolders() {
  if (fs.existsSync(tmpDirectory))
    await fs.promises.rm(tmpDirectory, { recursive: true });
  if (!fs.existsSync(tmpDirectory)) {
    console.log(`create tmp directory`);
    await fs.promises.mkdir(tmpDirectory);
  }
}

async function collectSegments(stream) {
  const { url, output } = stream;
  console.log(`processing ${output}`);
  await createWorkFolders();

  // find host and filename from url
  const masterPlaylistData = extractHostnameFilenameFromUrl(url);
  const masterFilename = masterPlaylistData.filename;
  const host = masterPlaylistData.hostUrl;

  const masterFilepath = await download(
    url,
    path.join(tmpDirectory, masterFilename)
  );
  // read file and queue downloads of inner files
  const masterData = await readFile(masterFilepath);
  // find first playlist file
  const playlistUrlFromMasterfile = scanMasterPlaylist(masterData);

  const playListFilenameData = extractHostnameFilenameFromUrl(
    playlistUrlFromMasterfile
  );
  // Extracts host url from playlist file
  const playlistHostUrl =
    playListFilenameData.hostUrl !== "" ? playListFilenameData.hostUrl : host;
  const playlistFilename = playListFilenameData.filename;
  const playlistFilenameUrl = `${playlistHostUrl}/${playlistFilename}`;

  // download it
  const playlistFilepath = await download(
    playlistFilenameUrl,
    path.join(tmpDirectory, playlistFilename)
  );
  // read file
  const playlistData = await readFile(playlistFilepath);
  // download needed .ts files
  const newPlaylistData = await scanPlaylist(playlistData, playlistHostUrl);
  const newPlaylistFilepath = await writeFile(
    newPlaylistData,
    path.join(tmpDirectory, `local_${playlistFilename}`)
  );
  return { output, newPlaylistFilepath };
}

async function downloadHLS(streams) {
  try {
    for (const stream of streams) {
      const { output, newPlaylistFilepath } = await collectSegments(stream);
      console.log(`done writing to ${newPlaylistFilepath}`);
      const command = `ffmpeg -protocol_whitelist file,http,https,tcp,tls,crypto -i ${newPlaylistFilepath} -c copy "${path.join(
        __dirname,
        output
      )}"`;
      console.log(`now executing ${command}`);
      await mergeSegments(command, output);
      // clean tmp directory
      if (fs.existsSync(tmpDirectory)) {
        console.log(`clean tmp directory`);
        await fs.promises.rm(tmpDirectory, { recursive: true });
      }
    }
  } catch (error) {
    throw new Error(error);
  }
}

const downloadFromBatchFile = async (configPath) => {
  const { streams } = getInputFile(configPath);
  await downloadHLS(streams);
};
const downloadFromCLIArgs = async (url, output) => {
  const streams = [{ url, output }];
  await downloadHLS(streams);
};

export { downloadFromCLIArgs, downloadFromBatchFile };
